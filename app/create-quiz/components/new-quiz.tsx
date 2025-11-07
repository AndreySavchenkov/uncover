import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTagEmoji } from "@/helpers/getTagEmoji";
import Image from "next/image";

type Props = {
  answersByTag: {
    tag: string;
    items: {
      id: string;
      question: string;
      answer: string;
      value: string;
    }[];
  }[];
  giftPreview: string | null;
  onClickUploadGift: () => void;
  clearGiftDraft: () => void;
  clearAnswers: () => void;
  submitAll: () => void;
  submitLoading: boolean;
  submitError: string | null;
  hasAnswers: boolean;
  hasPhoto: boolean;
};

export const NewQuiz = ({
  answersByTag,
  giftPreview,
  onClickUploadGift,
  clearGiftDraft,
  clearAnswers,
  submitAll,
  submitLoading,
  submitError,
  hasAnswers,
  hasPhoto,
}: Props) => {
  return (
    <>
      {answersByTag.length > 0 && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Your answers by tag (
                {answersByTag.reduce((n, g) => n + g.items.length, 0)})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Добавление/превью фото прямо в сводке */}
              <div className="flex items-center gap-3">
                {giftPreview ? (
                  <>
                    <Image
                      src={giftPreview}
                      alt="gift"
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded border object-cover"
                    />
                    <Button variant="outline" onClick={onClickUploadGift}>
                      Replace photo
                    </Button>
                    <Button variant="outline" onClick={clearGiftDraft}>
                      Remove
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={onClickUploadGift}>
                    Add photo
                  </Button>
                )}
              </div>

              {answersByTag.map((g) => (
                <div key={g.tag} className="space-y-2">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <span className="text-lg">{getTagEmoji(g.tag)}</span>
                    <span>{g.tag}</span>
                    <span className="text-xs text-muted-foreground">
                      {g.items.length}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {g.items.map((x) => (
                      <li key={x.id} className="text-sm">
                        <span className="font-medium">{x.question}</span>
                        <div className="text-muted-foreground">
                          → {x.answer}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {submitError && (
                <div className="text-sm text-red-500" role="alert">
                  {submitError}
                </div>
              )}
              {/* Подсказки, если не хватает данных для сабмита */}
              {!hasAnswers && (
                <div className="text-xs text-amber-600">
                  Select at least one answer to submit
                </div>
              )}
              {!hasPhoto && (
                <div className="text-xs text-amber-600">
                  Add a photo to submit
                </div>
              )}
              <div className="mt-2 flex gap-2">
                <Button variant="outline" onClick={clearAnswers}>
                  Clear all
                </Button>
                <Button
                  onClick={submitAll}
                  disabled={submitLoading || !hasAnswers || !hasPhoto}
                >
                  {submitLoading ? "Submitting..." : "Submit all"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};
