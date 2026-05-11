type LikertScaleProps = {
  value?: number;
  onChange: (value: number) => void;
  name: string;
};

const LIKERT_VALUES = [1, 2, 3, 4, 5] as const;

export function LikertScale({ value, onChange, name }: LikertScaleProps) {
  return (
    <div className="likert-scale" role="radiogroup" aria-label="Echelle de 1 a 5">
      {LIKERT_VALUES.map((option) => (
        <label key={option} className={`likert-option ${value === option ? "is-selected" : ""}`}>
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}
