"use client";

type SaveBarProps = {
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  disabled: boolean;
  dirty: boolean;
};

export function SaveBar({ onCancel, onSave, saving, disabled, dirty }: SaveBarProps) {
  return (
    <div className="save-bar">
      <button type="button" className="btn btn-tertiary" onClick={onCancel} disabled={saving || !dirty}>
        Annuler
      </button>
      <button type="button" className="btn btn-primary" onClick={onSave} disabled={disabled || saving}>
        {saving ? "Enregistrement..." : "Enregistrer"}
      </button>
    </div>
  );
}
