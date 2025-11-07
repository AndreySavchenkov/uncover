import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  selectedTag: string | null;
  questionsError: string | null;
  questionsLoading: boolean;
  questions: {
    id: string;
    text: string;
  }[];
  optionsByQuestion: {
    [questionId: string]: {
      id: string;
      text: string;
      value: string;
    }[];
  };
  optionsLoading: {
    [questionId: string]: boolean;
  };
  selected: {
    [questionId: string]: {
      value: string;
      text: string;
    };
  };
  answeredList: {
    id: string;
    question: string;
    answer: string;
    value: string;
  }[];
  expandedQuestionId: string | null;
  handleQuestionClick: (questionId: string) => void;
  handleSelect: (questionId: string, value: string, text: string) => void;
};

export const QuestionsByTag = ({
  selectedTag,
  questionsError,
  questionsLoading,
  questions,
  optionsByQuestion,
  optionsLoading,
  selected,
  answeredList,
  expandedQuestionId,
  handleQuestionClick,
  handleSelect,
}: Props) => {
  return (
    <>
      {selectedTag && (
        <div className="mt-6">
          <div className="mb-3 text-sm text-muted-foreground">
            Tag: {selectedTag}
          </div>

          {questionsError && (
            <div className="mb-4 text-sm text-red-500">{questionsError}</div>
          )}

          {questionsLoading ? (
            <div className="grid gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-5 w-2/3 bg-muted rounded animate-pulse" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="h-9 w-full bg-muted rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="text-muted-foreground">
              No questions for this tag
            </div>
          ) : (
            <>
              <div className="mb-3 text-sm">
                Answered: {answeredList.length} / {questions.length}
              </div>

              {/* список вопросов */}
              <div className="grid gap-4">
                {questions.map((q, idx) => {
                  const isOpen = expandedQuestionId === q.id;
                  const opts = optionsByQuestion[q.id] || [];
                  const isLoadingOpts = !!optionsLoading[q.id];

                  return (
                    <Card key={q.id}>
                      <CardHeader
                        onClick={() => handleQuestionClick(q.id)}
                        className="cursor-pointer"
                      >
                        <CardTitle className="text-base">
                          {idx + 1}. {q.text}
                        </CardTitle>
                      </CardHeader>
                      {isOpen && (
                        <CardContent className="flex flex-col gap-3">
                          {/* Варианты ответа */}
                          <div className="flex flex-wrap gap-2">
                            {isLoadingOpts ? (
                              Array.from({ length: 3 }).map((_, j) => (
                                <div
                                  key={j}
                                  className="h-9 w-24 bg-muted rounded animate-pulse"
                                />
                              ))
                            ) : opts.length === 0 ? (
                              <div className="text-sm text-muted-foreground">
                                No options
                              </div>
                            ) : (
                              opts.map((opt) => {
                                const isSelected =
                                  selected[q.id]?.value === opt.value;
                                return (
                                  <Button
                                    key={opt.id}
                                    variant={isSelected ? "default" : "outline"}
                                    onClick={() =>
                                      handleSelect(q.id, opt.value, opt.text)
                                    }
                                  >
                                    {opt.text}
                                  </Button>
                                );
                              })
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
