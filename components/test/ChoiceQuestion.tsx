import type { QuestionOption } from "@/lib/data/questions";

type ChoiceQuestionProps = {
  type: "single" | "multi";
  options: QuestionOption[];
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  name: string;
};

export function ChoiceQuestion({ type, options, value, onChange, name }: ChoiceQuestionProps) {
  if (type === "single") {
    return (
      <div className="choice-list" role="radiogroup" aria-label="Choisis une reponse">
        {options.map((option) => (
          <label key={option.value} className={`choice-option ${value === option.value ? "is-selected" : ""}`}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    );
  }

  const selectedValues = Array.isArray(value) ? value : [];

  return (
    <div className="choice-list" role="group" aria-label="Choisis une ou plusieurs reponses">
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.value);
        return (
          <label key={option.value} className={`choice-option ${isSelected ? "is-selected" : ""}`}>
            <input
              type="checkbox"
              name={`${name}-${option.value}`}
              value={option.value}
              checked={isSelected}
              onChange={() => {
                const next = isSelected
                  ? selectedValues.filter((item) => item !== option.value)
                  : [...selectedValues, option.value];
                onChange(next);
              }}
            />
            <span>{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}
