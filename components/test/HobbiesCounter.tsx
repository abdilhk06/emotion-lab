type HobbiesCounterProps = {
  selectedCount: number;
  min: number;
  max: number;
};

export function HobbiesCounter({ selectedCount, min, max }: HobbiesCounterProps) {
  const canContinue = selectedCount >= min;
  const atMax = selectedCount >= max;

  return (
    <div className="hobbies-header-info" role="status" aria-live="polite">
      <div className="hobbies-count">
        <span className="num">{selectedCount}</span> loisirs selectionnes
      </div>
      {atMax ? (
        <span className="hobbies-status is-max">Limite atteinte ({max}/{max})</span>
      ) : canContinue ? (
        <span className="hobbies-status is-valid">Tu peux continuer</span>
      ) : (
        <span className="hobbies-status is-min">Selectionne encore {min - selectedCount}</span>
      )}
    </div>
  );
}
