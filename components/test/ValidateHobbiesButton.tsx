type ValidateHobbiesButtonProps = {
  canSubmit: boolean;
  onSubmit: () => void;
};

export function ValidateHobbiesButton({ canSubmit, onSubmit }: ValidateHobbiesButtonProps) {
  return (
    <button type="button" className="btn btn-primary btn-full btn-lg" onClick={onSubmit} disabled={!canSubmit}>
      Valider mes loisirs
    </button>
  );
}
