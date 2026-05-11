type HobbyChipProps = {
  label: string;
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: () => void;
};

export function HobbyChip({ label, isSelected, isDisabled, onToggle }: HobbyChipProps) {
  return (
    <button
      type="button"
      className={`hobby-chip ${isSelected ? "is-selected" : ""}`.trim()}
      onClick={onToggle}
      disabled={isDisabled}
      aria-pressed={isSelected}
    >
      {label}
    </button>
  );
}
