type TestNavigationProps = {
  isFirst: boolean;
  isLast: boolean;
  canProceed: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function TestNavigation({ isFirst, isLast, canProceed, onPrevious, onNext }: TestNavigationProps) {
  return (
    <div className="test-navigation">
      <button type="button" className="btn btn-tertiary" onClick={onPrevious} disabled={isFirst}>
        Precedent
      </button>
      <button type="button" className="btn btn-primary" onClick={onNext} disabled={!canProceed}>
        {isLast ? "Terminer" : "Suivant"}
      </button>
    </div>
  );
}
