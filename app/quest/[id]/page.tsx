"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type AnswerItem = {
  question_id: string;
  tag: string;
  question: string;
  value: string;
  text: string;
};

type QuestRow = {
  id: string;
  created_at: string;
  user_id: string | null;
  tags: string[];
  gift_url: string | null;
  answers: AnswerItem[];
};

type Option = {
  id: string;
  question_id: string;
  value: string;
  text: string;
  order_index: number;
};

type ResponseRow = {
  id: string;
  created_at: string;
  responder_id: string | null;
  gift_url: string | null;
  answers: Array<{ question_id: string; value: string; text: string }>;
  // локальные флаги (можем не хранить в типе ответа, обновляем по факту)
  ownerAccepted?: boolean;
  responderAccepted?: boolean;
};

type AcceptanceRow = {
  owner_accepted: boolean | null;
  responder_accepted: boolean | null;
};

export default function QuestPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();

  const [quest, setQuest] = useState<QuestRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const isOwner = !!user?.id && quest?.user_id === user.id;

  // Данные для ответа респондента
  const [optsByQ, setOptsByQ] = useState<Record<string, Option[]>>({});
  const [myAns, setMyAns] = useState<
    Record<string, { value: string; text: string }>
  >({});
  const [myGiftFile, setMyGiftFile] = useState<File | null>(null);
  const [myGiftPreview, setMyGiftPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false); // после сабмита раскрываем контент автора

  // ответы респондентов (видит владелец)
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [respLoading, setRespLoading] = useState(false);
  const [myResponseId, setMyResponseId] = useState<string | null>(null);
  const [acceptBusy, setAcceptBusy] = useState<string | null>(null);
  const [myAccepted, setMyAccepted] = useState<boolean>(false); // ← акцепт респондента

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr(null);
      const { data, error } = await supabase
        .from("quests")
        .select("id, created_at, user_id, tags, gift_url, answers")
        .eq("id", id)
        .maybeSingle();

      if (!mounted) return;

      if (error || !data) {
        setErr(error?.message || "Quest not found");
        setQuest(null);
        setLoading(false);
        return;
      }

      const q = data as QuestRow;
      setQuest(q);
      setLoading(false);

      // Если не владелец — подгружаем опции для вопросов
      const qids = Array.from(
        new Set((data as QuestRow).answers.map((a) => a.question_id))
      );
      if (qids.length) {
        const { data: opts } = await supabase
          .from("quest_options")
          .select("id, question_id, value, text, order_index")
          .in("question_id", qids)
          .order("order_index", { ascending: true });

        const byQ: Record<string, Option[]> = {};
        (opts || []).forEach((row: any) => {
          const arr = byQ[row.question_id] || (byQ[row.question_id] = []);
          arr.push({
            id: row.id,
            value: row.value,
            text: row.text,
            order_index: row.order_index,
            question_id: row.question_id,
          });
        });
        if (mounted) setOptsByQ(byQ);
      }

      // если не владелец — проверяем, отвечал ли уже текущий пользователь
      if (user?.id && q.user_id !== user.id) {
        const { data: existing } = await supabase
          .from("quest_responses")
          .select("id")
          .eq("quest_id", q.id)
          .eq("responder_id", user.id)
          .maybeSingle();
        if (mounted && existing) {
          setRevealed(true);
          const rid = (existing as any).id as string;
          setMyResponseId(rid);

          // подгружаем состояние акцепта
          const { data: acc } = await supabase
            .from("quest_acceptances")
            .select("owner_accepted, responder_accepted")
            .eq("response_id", rid)
            .maybeSingle<AcceptanceRow>();
          if (mounted && acc) {
            setMyAccepted(!!acc.responder_accepted);
          }
        }
      }

      // Владелец: загрузить ответы респондентов к этому квесту
      if (user?.id && q.user_id === user.id) {
        setRespLoading(true);
        const { data: resps, error: rErr } = await supabase
          .from("quest_responses")
          .select("id, created_at, responder_id, gift_url, answers")
          .eq("quest_id", q.id)
          .order("created_at", { ascending: false });

        if (mounted) {
          const list = (resps as ResponseRow[]) || [];

          // подтянуть accept-состояния по id ответов
          const ids = list.map((r) => r.id);
          let accMap: Record<
            string,
            {
              owner_accepted: boolean | null;
              responder_accepted: boolean | null;
            }
          > = {};
          if (ids.length) {
            const { data: accs } = await supabase
              .from("quest_acceptances")
              .select("response_id, owner_accepted, responder_accepted")
              .in("response_id", ids);

            (accs || []).forEach((a: any) => {
              accMap[a.response_id] = {
                owner_accepted: a.owner_accepted,
                responder_accepted: a.responder_accepted,
              };
            });
          }

          // проставить флаги в локальные карточки
          const withFlags = list.map((r) => {
            const acc = accMap[r.id];
            return {
              ...r,
              ownerAccepted: !!acc?.owner_accepted,
              responderAccepted: !!acc?.responder_accepted,
            };
          });

          setResponses(withFlags);
          setRespLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
      if (myGiftPreview) URL.revokeObjectURL(myGiftPreview);
    };
  }, [id, user?.id]);

  const grouped = useMemo(() => {
    const groups: Record<string, AnswerItem[]> = {};
    (quest?.answers || []).forEach((a) => {
      const tag = (a.tag || "").trim();
      if (!tag) return;
      (groups[tag] ||= []).push(a);
    });
    return Object.entries(groups)
      .map(([tag, items]) => ({
        tag,
        items: items
          .slice()
          .sort((a, b) => a.question.localeCompare(b.question)),
      }))
      .sort((a, b) => a.tag.localeCompare(b.tag));
  }, [quest]);

  // карта вопрос_id -> текст вопроса (для подписей в ответах респондента)
  const questionById = useMemo(() => {
    const m: Record<string, { question: string; tag: string }> = {};
    (quest?.answers ?? []).forEach((a) => {
      m[a.question_id] = { question: a.question, tag: a.tag };
    });
    return m;
  }, [quest]);

  // Локальный предпросмотр: есть хотя бы один ответ и загружено локальное фото
  const canLocalPreview = useMemo(
    () => !isOwner && Object.keys(myAns).length > 0 && !!myGiftPreview,
    [isOwner, myAns, myGiftPreview]
  );

  const pick = (qid: string, value: string, text: string) => {
    setMyAns((prev) => ({ ...prev, [qid]: { value, text } }));
  };

  const onClickUpload = () => fileRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return alert("Unsupported file type");
    if (f.size > 5 * 1024 * 1024) return alert("Photo > 5MB");
    if (myGiftPreview) URL.revokeObjectURL(myGiftPreview);
    setMyGiftFile(f);
    setMyGiftPreview(URL.createObjectURL(f));
  };
  const clearMyGift = () => {
    if (myGiftPreview) URL.revokeObjectURL(myGiftPreview);
    setMyGiftFile(null);
    setMyGiftPreview(null);
  };

  // Accept со стороны респондента:
  // 1) при первом accept создаём quest_responses + грузим фото
  // 2) ставим responder_accepted в quest_acceptances
  const acceptAsResponder = async () => {
    if (!user?.id) {
      alert("Login required");
      return;
    }
    if (!quest) return;

    // Требуем и ответы, и фото
    const qids = new Set(quest.answers.map((a) => a.question_id));
    const answered = Object.keys(myAns).filter((k) => qids.has(k));
    if (answered.length === 0) {
      alert("Please answer at least one question");
      return;
    }
    if (!myGiftFile) {
      alert("Please add your photo");
      return;
    }

    setAcceptBusy(myResponseId || "new");
    try {
      let respId = myResponseId;

      // Если это первый accept — создаём ответ и загружаем фото
      if (!respId) {
        const items = quest.answers
          .filter((a) => myAns[a.question_id])
          .map((a) => ({
            question_id: a.question_id,
            value: myAns[a.question_id].value,
            text: myAns[a.question_id].text,
          }));

        // 1) создаём запись ответа
        const { data: created, error: insErr } = await supabase
          .from("quest_responses")
          .insert({
            quest_id: quest.id,
            responder_id: user.id,
            answers: items,
          })
          .select("id")
          .single();
        if (insErr) {
          if ((insErr as any).code === "23505") {
            // уже отвечал ранее — открываем существующий
            const { data: existing } = await supabase
              .from("quest_responses")
              .select("id")
              .eq("quest_id", quest.id)
              .eq("responder_id", user.id)
              .maybeSingle();
            if (existing) {
              respId = (existing as any).id as string;
              setMyResponseId(respId);
            }
          } else {
            throw insErr;
          }
        } else {
          respId = (created as any).id as string;
          setMyResponseId(respId);
        }

        // 2) загружаем фото и обновляем ответ
        if (respId && myGiftFile) {
          const ext = (myGiftFile.name.split(".").pop() || "jpg").toLowerCase();
          const path = `responses/${respId}/gift.${ext}`;
          const up = await supabase.storage
            .from("gifts")
            .upload(path, myGiftFile, {
              contentType: myGiftFile.type,
              cacheControl: "3600",
              upsert: true,
            });
          if (up.error) {
            // если не удалось — удаляем созданную запись (best-effort)
            try {
              await supabase.from("quest_responses").delete().eq("id", respId);
            } catch {}
            throw up.error;
          }
          const { data: pub } = supabase.storage
            .from("gifts")
            .getPublicUrl(path);
          const url = pub.publicUrl;

          const { error: updErr } = await supabase
            .from("quest_responses")
            .update({ gift_path: path, gift_url: url })
            .eq("id", respId);
          if (updErr) throw updErr;
        }
      }

      // 3) помечаем мой акцепт (не влияет на +25)
      if (respId) {
        const { error: accErr } = await supabase
          .from("quest_acceptances")
          .upsert(
            { response_id: respId, responder_accepted: true },
            { onConflict: "response_id" }
          );
        if (accErr) throw accErr;
      }

      // Включаем видимость контента и фиксируем состояние
      setRevealed(true);
      setMyAccepted(true);
      setSubmitError(null);
      // по желанию: очистить локальные черновики
      // setMyAns({}); clearMyGift();
    } catch (e: any) {
      alert(e?.message || "Failed to accept");
    } finally {
      setAcceptBusy(null);
    }
  };

  // Reject со стороны респондента: ничего не отправляем, просто чистим черновик и скрываем предпросмотр
  const rejectAsResponder = () => {
    setSubmitError(null);
    setMyAns({});
    clearMyGift();
    setRevealed(false);
    setMyResponseId(null);
    setMyAccepted(false);
  };

  // Accept со стороны владельца квеста (+локально помечаем карточку ответа)
  const acceptAsOwner = async (responseId: string) => {
    setAcceptBusy(responseId);
    try {
      const { error } = await supabase
        .from("quest_acceptances")
        .upsert(
          { response_id: responseId, owner_accepted: true },
          { onConflict: "response_id" }
        );
      if (error) throw error;

      // локально обновим карточку
      setResponses((prev) =>
        prev.map((r) =>
          r.id === responseId ? { ...r, ownerAccepted: true } : r
        )
      );
    } catch (e: any) {
      alert(e?.message || "Failed to accept");
    } finally {
      setAcceptBusy(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 mb-10 px-4 sm:px-6">
      {/* hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Quest</h1>
        <Button asChild variant="outline">
          <Link href="/profile">Back to profile</Link>
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardHeader>
            <div className="h-5 w-40 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-48 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      ) : err ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-red-500">{err}</div>
          </CardContent>
        </Card>
      ) : !quest ? null : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {new Date(quest.created_at).toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Фото автора квеста: блюр до сабмита для не-владельца */}
            {quest.gift_url ? (
              <div className="relative">
                <img
                  src={quest.gift_url}
                  alt="gift"
                  className={`w-full h-48 rounded border object-cover ${
                    isOwner || revealed || canLocalPreview ? "" : "blur-md"
                  }`}
                />
                {!isOwner && !revealed && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="rounded bg-black/40 text-white px-3 py-1 text-sm">
                      Photo hidden — submit your answers to reveal
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-48 rounded border bg-muted flex items-center justify-center text-muted-foreground text-sm">
                No gift photo
              </div>
            )}

            {/* Теги */}
            <div className="flex flex-wrap gap-2">
              {(quest.tags || []).map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 text-xs rounded-full border bg-muted"
                  title={t}
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Контент в зависимости от роли */}
            {isOwner ? (
              <div className="space-y-6">
                {/* Ответы владельца */}
                <OwnerAnswers grouped={grouped} />

                {/* Ответы респондентов */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    Responses ({responses.length})
                  </div>
                  {respLoading ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-24 w-full bg-muted rounded animate-pulse" />
                          <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                        </div>
                      ))}
                    </div>
                  ) : responses.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No responses yet
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {responses.map((r) => (
                        <div key={r.id} className="rounded border p-3">
                          <div className="mb-2 text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleString()}
                          </div>
                          {r.gift_url ? (
                            <img
                              src={r.gift_url}
                              alt="responder gift"
                              className="w-full h-24 rounded border object-cover"
                            />
                          ) : (
                            <div className="w-full h-24 rounded border bg-muted flex items-center justify-center text-muted-foreground text-xs">
                              No photo
                            </div>
                          )}
                          <div className="mt-2 text-sm">
                            Answers: {r.answers?.length ?? 0}
                          </div>

                          {/* ответы респондента */}
                          {r.answers?.length ? (
                            <ul className="mt-2 space-y-1 text-sm">
                              {r.answers.map((a, i) => {
                                const qText =
                                  questionById[a.question_id]?.question ||
                                  "Question";
                                return (
                                  <li key={`${a.question_id}-${i}`}>
                                    <span className="font-medium">{qText}</span>
                                    <div className="text-muted-foreground">
                                      → {a.text}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : null}

                          <div className="mt-3">
                            <Button
                              variant="outline"
                              onClick={() => acceptAsOwner(r.id)}
                              disabled={acceptBusy === r.id || r.ownerAccepted}
                            >
                              {r.ownerAccepted
                                ? "Accepted"
                                : acceptBusy === r.id
                                ? "Accepting..."
                                : "Accept"}
                            </Button>
                          </div>

                          {r.responder_id && (
                            <div className="mt-2">
                              <Link
                                href={`/users/${r.responder_id}`}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Open responder profile
                              </Link>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : revealed || canLocalPreview ? (
              <>
                {/* После сабмита — показываем ответы автора */}
                <OwnerAnswers grouped={grouped} />

                {/* Если уже акцептировал — вместо кнопок показываем сообщение */}
                {myAccepted ? (
                  <div className="mt-3 rounded-md border bg-background p-3 text-sm text-green-700">
                    You have already answered and accepted this quest.
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="default"
                      onClick={acceptAsResponder}
                      disabled={!!acceptBusy}
                    >
                      {acceptBusy ? "Saving..." : "Accept"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={rejectAsResponder}
                      disabled={!!acceptBusy}
                    >
                      Reject
                    </Button>
                    {!revealed && canLocalPreview && (
                      <span className="text-xs text-muted-foreground self-center">
                        Preview mode — nothing sent yet
                      </span>
                    )}
                  </div>
                )}
              </>
            ) : (
              // До сабмита — форма ответов + загрузка своего фото
              <div className="space-y-5">
                {grouped.map((g) => (
                  <div key={g.tag} className="space-y-2">
                    <div className="text-sm font-medium">
                      {g.tag} • {g.items.length}
                    </div>
                    <div className="space-y-2">
                      {g.items.map((a) => {
                        const opts = optsByQ[a.question_id] || [];
                        const picked = myAns[a.question_id]?.value;
                        return (
                          <div key={a.question_id} className="text-sm">
                            <div className="font-medium">{a.question}</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {opts.length === 0 ? (
                                <div className="text-xs text-muted-foreground">
                                  No options
                                </div>
                              ) : (
                                opts.map((o) => (
                                  <Button
                                    key={o.id}
                                    variant={
                                      picked === o.value ? "default" : "outline"
                                    }
                                    onClick={() =>
                                      pick(a.question_id, o.value, o.text)
                                    }
                                  >
                                    {o.text}
                                  </Button>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Фото респондента */}
                <div className="flex items-center gap-3">
                  {myGiftPreview ? (
                    <>
                      <img
                        src={myGiftPreview}
                        alt="your gift"
                        className="h-16 w-16 rounded border object-cover"
                      />
                      <Button variant="outline" onClick={onClickUpload}>
                        Replace photo
                      </Button>
                      <Button variant="outline" onClick={clearMyGift}>
                        Remove
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" onClick={onClickUpload}>
                      Add your photo
                    </Button>
                  )}
                </div>

                {submitError && (
                  <div className="text-sm text-red-500">{submitError}</div>
                )}
                {/* Кнопка сабмита убрана */}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function OwnerAnswers({
  grouped,
}: {
  grouped: { tag: string; items: AnswerItem[] }[];
}) {
  if (grouped.length === 0)
    return <div className="text-sm text-muted-foreground">No answers</div>;
  return (
    <div className="space-y-4">
      {grouped.map((g) => (
        <div key={g.tag} className="space-y-2">
          <div className="text-sm font-medium">
            {g.tag} • {g.items.length}
          </div>
          <ul className="space-y-1">
            {g.items.map((a) => (
              <li key={a.question_id} className="text-sm">
                <span className="font-medium">{a.question}</span>
                <div className="text-muted-foreground">→ {a.text}</div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
