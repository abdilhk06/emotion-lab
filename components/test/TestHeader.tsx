import Link from "next/link";

type TestHeaderProps = {
  username?: string;
  progressText?: string;
  backHref?: string;
};

export function TestHeader({ username = "@ton_pseudo", progressText, backHref = "/test/intro" }: TestHeaderProps) {
  return (
    <header className="test-header">
      <div className="test-header-left">
        <Link href={backHref} className="test-quit-btn" aria-label="Retour">
          &larr;
        </Link>
        <Link href="/" className="logo test-logo">
          <span aria-label="Emotion Lab" className="brand-logo brand-logo-sm" role="img" />
          Emotion Lab
        </Link>
      </div>
      <div className="test-progress-inline">
        {progressText ? <span className="progress-number">{progressText}</span> : null}
        <p className="test-header-user">{username}</p>
      </div>
    </header>
  );
}
