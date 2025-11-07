/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { CORE_TAG_ORDER, CoreTag } from "@/types";
import { Tags } from "./components/tags";
import { NewQuiz } from "./components/new-quiz";

const QuestionsByTag = dynamic(
  () =>
    import("./components/questions-by-tag").then(
      (m) => m.QuestionsByTag
    ),
  {
    loading: () => (
      <div className="mt-6 space-y-3">
        <div className="h-5 w-40 bg-muted rounded animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-full bg-muted rounded animate-pulse" />
        ))}
      </div>
    ),
    ssr: false,
  }
);

type QuizOption = {
  id: string;
  value: string;
  text: string;
  order_index: number;
};

type QuizQuestionLite = {
  id: string;
  text: string;
};

type AnswerEntry = {
  value: string;
  text: string;
  tag: string;
  question: string;
};

export default function CreateQuizPage() {
  const router = useRouter();

  // Шаг 1: теги
  const [tags, setTags] = useState<string[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});

  // Шаг 2: выбранный тег -> вопросы
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionLite[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  // Шаг 3: клик по вопросу -> варианты
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(
    null
  );
  const [optionsByQuestion, setOptionsByQuestion] = useState<
    Record<string, QuizOption[]>
  >({});
  const [optionsLoading, setOptionsLoading] = useState<Record<string, boolean>>(
    {}
  );
  // храним и value, и текст ответа + тег и текст вопроса
  const [selected, setSelected] = useState<Record<string, AnswerEntry>>({});

  // Фото "подарков" по вопросу
  const [photos, setPhotos] = useState<
    Record<string, { path: string; url: string }>
  >({});
  const LS_PHOTOS = "uncover:giftPhotos";

  // восстановление/сохранение фото в localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_PHOTOS);
      if (raw) setPhotos(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(LS_PHOTOS, JSON.stringify(photos));
    } catch {}
  }, [photos]);

  // УБРАТЬ старое состояние giftPhoto и логику загрузки в Storage
  // ВМЕСТО НЕГО: черновик фото (локально), превью и отправка на submit
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<"gift" | null>(null);
  const [giftFile, setGiftFile] = useState<File | null>(null);
  const [giftPreview, setGiftPreview] = useState<string | null>(null);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // obtain current user from hook (provides `user` used during submit)
  const { user } = useUser();

  const onClickUploadGift = () => {
    setUploadTarget("gift");
    fileInputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || uploadTarget !== "gift") return;
    if (!file.type.startsWith("image/")) {
      toast.error("Unsupported file type");
      setUploadTarget(null);
      return;
    }
    const MAX = 5 * 1024 * 1024;
    if (file.size > MAX) {
      toast.error("Photo is larger than 5MB");
      setUploadTarget(null);
      return;
    }
    if (giftPreview) URL.revokeObjectURL(giftPreview);
    setGiftFile(file);
    setGiftPreview(URL.createObjectURL(file));
    setUploadTarget(null);
  };

  const clearGiftDraft = () => {
    if (giftPreview) URL.revokeObjectURL(giftPreview);
    setGiftPreview(null);
    setGiftFile(null);
  };

  // Восстановление ответов из localStorage (если есть)
  const LS_KEY = "uncover:answers";
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, any>;
        const norm: Record<string, AnswerEntry> = {};
        for (const [qid, v] of Object.entries(parsed)) {
          // совместимость со старым форматом {value,text}
          norm[qid] = {
            value: (v as any).value,
            text: (v as any).text,
            tag: (v as any).tag || "unknown",
            question: (v as any).question || "",
          };
        }
        setSelected(norm);
      }
    } catch {}
  }, []);

  // Сохранение ответов в localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(selected));
    } catch {}
  }, [selected]);

  // сохранить выбор (и значение, и текст для сводки) + привязать к тегу и тексту вопроса
  const handleSelect = (
    qId: string,
    optionValue: string,
    optionText: string
  ) => {
    const q = questions.find((x) => x.id === qId);
    setSelected((prev) => ({
      ...prev,
      [qId]: {
        value: optionValue,
        text: optionText,
        tag: selectedTag || "unknown",
        question: q?.text || "",
      },
    }));
  };

  // Загрузка тегов с активными EN-вопросами
  useEffect(() => {
    let mounted = true;
    (async () => {
      setTagsLoading(true);
      setTagsError(null);
      const { data, error } = await supabase
        .from("quest_question_tags")
        .select("tag_name, quest_questions!inner ( id )")
        .eq("quest_questions.language", "en")
        .eq("quest_questions.is_active", true);

      if (!mounted) return;
      if (error) {
        console.error(error);
        setTagsError(error.message || "Failed to load tags");
        setTags([]);
        setTagCounts({});
      } else {
        const rows = (data || []) as Array<{ tag_name: string }>;
        const counts: Record<string, number> = {};
        for (const r of rows)
          counts[r.tag_name] = (counts[r.tag_name] || 0) + 1;

        const uniq = Object.keys(counts).sort((a, b) => {
          const ka = a.trim().toLowerCase();
          const kb = b.trim().toLowerCase();
          const ia = CORE_TAG_ORDER.indexOf(ka as CoreTag);
          const ib = CORE_TAG_ORDER.indexOf(kb as CoreTag);
          if (ia !== -1 && ib !== -1) return ia - ib;
          if (ia !== -1) return -1;
          if (ib !== -1) return 1;
          return a.localeCompare(b);
        });

        setTags(uniq);
        setTagCounts(counts);
      }
      setTagsLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Загрузка вопросов по тегу
  const loadQuestionsByTag = async (tag: string) => {
    setQuestionsLoading(true);
    setQuestionsError(null);
    setExpandedQuestionId(null);
    try {
      const { data, error } = await supabase
        .from("quest_question_tags")
        .select("question_id, quest_questions!inner ( id, text )")
        .eq("tag_name", tag)
        .eq("quest_questions.language", "en")
        .eq("quest_questions.is_active", true);
      if (error) throw error;

      const rows = (data || []) as Array<{
        question_id: string;
        // quest_questions can be returned as a single object or an array depending on the join,
        // so accept both shapes here.
        quest_questions:
          | { id: string; text: string }
          | { id: string; text: string }[]
          | null;
      }>;

      const map = new Map<string, QuizQuestionLite>();
      for (const r of rows) {
        let q = r.quest_questions as any;
        if (Array.isArray(q)) q = q[0];
        if (q && q.id) map.set(q.id, { id: q.id, text: q.text });
      }
      const list = Array.from(map.values());
      setQuestions(list);

      // pull photos for these questions
      const ids = list.map((q) => q.id);
      if (ids.length) {
        const { data: ph } = await supabase
          .from("answer_photos")
          .select("question_id, storage_path, public_url")
          .in("question_id", ids);
        const byQ: Record<string, { path: string; url: string }> = {};
        (ph || []).forEach((r) => {
          byQ[(r as any).question_id] = {
            path: (r as any).storage_path,
            url: (r as any).public_url,
          };
        });
        setPhotos((prev) => ({ ...prev, ...byQ }));
      }
    } catch (e: any) {
      console.error(e);
      setQuestionsError(e.message || "Failed to load questions");
      setQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  };

  // Загрузка вариантов по вопросу (ленивая, с кешем)
  const loadOptionsForQuestion = async (qId: string) => {
    if (optionsByQuestion[qId]) return; // уже загружены
    setOptionsLoading((prev) => ({ ...prev, [qId]: true }));
    try {
      const { data, error } = await supabase
        .from("quest_options")
        .select("id, value, text, order_index")
        .eq("question_id", qId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setOptionsByQuestion((prev) => ({
        ...prev,
        [qId]: (data || []) as QuizOption[],
      }));
    } catch (e: any) {
      console.error(e);
    } finally {
      setOptionsLoading((prev) => ({ ...prev, [qId]: false }));
    }
  };

  const handleTagClick = async (tag: string) => {
    setSelectedTag(tag);
    await loadQuestionsByTag(tag);
  };

  const handleQuestionClick = async (qId: string) => {
    const next = expandedQuestionId === qId ? null : qId;
    setExpandedQuestionId(next);
    if (next) await loadOptionsForQuestion(next);
  };

  const resetToTags = () => {
    setSelectedTag(null);
    setQuestions([]);
    setExpandedQuestionId(null);
  };

  // Сводка: отвеченные вопросы текущего тега
  const answeredList = useMemo(
    () =>
      questions
        .filter((q) => !!selected[q.id])
        .map((q) => ({
          id: q.id,
          question: q.text,
          answer: selected[q.id].text,
          value: selected[q.id].value,
        })),
    [questions, selected]
  );

  // Глобальная сводка: ответы, сгруппированные по тегу
  const answersByTag = useMemo(() => {
    const groups: Record<
      string,
      { id: string; question: string; answer: string; value: string }[]
    > = {};
    for (const [qid, a] of Object.entries(selected)) {
      if (!a?.tag) continue;
      if (!groups[a.tag]) groups[a.tag] = [];
      groups[a.tag].push({
        id: qid,
        question: a.question || "",
        answer: a.text,
        value: a.value,
      });
    }
    // сортировка внутри тегов по алфавиту вопроса
    for (const k of Object.keys(groups)) {
      groups[k].sort((x, y) => x.question.localeCompare(y.question));
    }
    // вернуть в порядке CORE_TAG_ORDER, затем алфавит
    const order = new Map(CORE_TAG_ORDER.map((t, i) => [t, i]));
    return Object.entries(groups)
      .sort((a, b) => {
        const ia = order.has(a[0]) ? (order.get(a[0]) as number) : 999;
        const ib = order.has(b[0]) ? (order.get(b[0]) as number) : 999;
        if (ia !== ib) return ia - ib;
        return a[0].localeCompare(b[0]);
      })
      .map(([tag, items]) => ({ tag, items }));
  }, [selected]);

  const clearAnswers = () => setSelected({});

  // Требования к сабмиту: должны быть и ответы, и фото
  const hasAnswers = answersByTag.length > 0;
  const hasPhoto = !!giftFile;

  useEffect(() => {
    // убираем ошибку как только условия выполнены
    if (hasAnswers && hasPhoto && submitError) setSubmitError(null);
  }, [hasAnswers, hasPhoto, submitError]);


  // Сабмит всех ответов: 1) пишем ответы, 2) если ок — грузим фото и обновляем запись
  const submitAll = async () => {
    const hasAnyAnswer = Object.keys(selected).length > 0;
    if (!hasAnyAnswer || !giftFile) {
      const msg =
        !hasAnyAnswer && !giftFile
          ? "Add a photo and select at least one answer"
          : !hasAnyAnswer
          ? "Select at least one answer"
          : "Add a photo";
      setSubmitError(msg);
      return;
    }

    setSubmitLoading(true);
    setSubmitError(null);
    try {
      const items = Object.entries(selected).map(([qid, a]) => ({
        question_id: qid,
        tag: a.tag,
        question: a.question,
        value: a.value,
        text: a.text,
      }));
      const tagsUniq = Array.from(new Set(items.map((i) => i.tag)));

      // 1) создаём квест с ответами
      const { data: ins, error: insErr } = await supabase
        .from("quests")
        .insert({ user_id: user?.id ?? null, tags: tagsUniq, answers: items })
        .select("id")
        .single();
      if (insErr) throw insErr;
      const questId = ins!.id as string;

      // 2) если есть фото — загружаем и обновляем квест gift_url/gift_path
      if (giftFile) {
        const ext = (giftFile.name.split(".").pop() || "jpg").toLowerCase();
        const path = `quests/${questId}/gift.${ext}`;
        const up = await supabase.storage.from("gifts").upload(path, giftFile, {
          contentType: giftFile.type,
          cacheControl: "3600",
          upsert: true,
        });
        if (up.error) {
          // откат — чтобы не осталось квеста без фото по вашей логике
          await supabase.from("quests").delete().eq("id", questId);
          throw up.error;
        }
        const { data: pub } = supabase.storage.from("gifts").getPublicUrl(path);
        const url = pub.publicUrl;

        const { error: updErr } = await supabase
          .from("quests")
          .update({ gift_path: path, gift_url: url })
          .eq("id", questId);
        if (updErr) {
          await supabase.from("quests").delete().eq("id", questId);
          throw updErr;
        }
      }

      toast.success("Quiz created");
      // очистка локальных данных
      setSelected({});
      localStorage.removeItem("uncover:answers");
      clearGiftDraft();

      // перейти на созданный квест
      router.push(`/quest/${questId}`);
    } catch (e: any) {
      setSubmitError(e.message || "Failed to submit");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 mb-10 px-4 sm:px-6">
      {/* скрытый input для загрузки */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      <div className="mb-4 flex items-center justify-between">
        {selectedTag && (
          <Button variant="outline" onClick={resetToTags}>
            All tags
          </Button>
        )}
      </div>

      {/* Step 1: tags and quiz */}
      {!selectedTag && (
        <>
          <Tags
            tagsError={tagsError}
            tagsLoading={tagsLoading}
            tags={tags}
            tagCounts={tagCounts}
            handleTagClick={handleTagClick}
          />

          <NewQuiz
            answersByTag={answersByTag}
            giftPreview={giftPreview}
            onClickUploadGift={onClickUploadGift}
            clearGiftDraft={clearGiftDraft}
            clearAnswers={clearAnswers}
            submitAll={submitAll}
            submitLoading={submitLoading}
            submitError={submitError}
            hasAnswers={hasAnswers}
            hasPhoto={hasPhoto}
          />
        </>
      )}

      {/* Шаг 2: список вопросов выбранного тега */}
      <QuestionsByTag
        selectedTag={selectedTag}
        questionsError={questionsError}
        questionsLoading={questionsLoading}
        questions={questions}
        optionsByQuestion={optionsByQuestion}
        optionsLoading={optionsLoading}
        selected={selected}
        answeredList={answeredList}
        expandedQuestionId={expandedQuestionId}
        handleQuestionClick={handleQuestionClick}
        handleSelect={handleSelect}
      />
    </div>
  );
}
