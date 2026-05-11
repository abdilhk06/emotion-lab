import { ChoiceQuestion } from "@/components/test/ChoiceQuestion";
import { LikertScale } from "@/components/test/LikertScale";
import type { TestQuestion } from "@/lib/data/questions";

export type AnswerValue = number | string | string[];

type QuestionBlockProps = {
  question: TestQuestion;
  index: number;
  value?: AnswerValue;
  onChange: (questionId: string, value: AnswerValue) => void;
};

export function QuestionBlock({ question, index, value, onChange }: QuestionBlockProps) {
  return (
    <article className="question-block">
      <p className="question-index">Question {index + 1}</p>
      <p className="question-text">{question.text}</p>
      {question.dimension ? <p className="question-dimension">Dimension: {question.dimension}</p> : null}

      {question.type === "likert" ? (
        <LikertScale
          name={question.id}
          value={typeof value === "number" ? value : undefined}
          onChange={(next) => onChange(question.id, next)}
        />
      ) : (
        <ChoiceQuestion
          name={question.id}
          type={question.type}
          options={question.options ?? []}
          value={value as string | string[] | undefined}
          onChange={(next) => onChange(question.id, next)}
        />
      )}
    </article>
  );
}
