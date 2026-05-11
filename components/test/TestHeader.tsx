import Link from "next/link";

type TestHeaderProps = {
  username?: string;
};

export function TestHeader({ username = "@ton_pseudo" }: TestHeaderProps) {
  return (
    <header className="test-header">
      <div className="test-header-left">
        <Link href="/" className="logo test-logo">
          <span aria-label="Emotion Lab" className="brand-logo brand-logo-sm" role="img" />
          Emotion Lab
        </Link>
      </div>
      <p className="test-header-user">{username}</p>
    </header>
  );
}
