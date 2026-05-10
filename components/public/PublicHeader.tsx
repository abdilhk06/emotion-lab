import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="header-public">
      <Link className="logo" href="/">
        <span aria-label="Emotion Lab" className="brand-logo brand-logo-sm logo-img" role="img" />
        <span>Emotion Lab</span>
      </Link>
      <nav className="nav-links only-desktop">
        <a href="#">A propos</a>
        <a href="#">FAQ</a>
        <Link
          className="btn btn-tertiary"
          href="/login"
          style={{ padding: "8px 18px", minHeight: "auto", fontSize: "14px" }}
        >
          Se connecter
        </Link>
      </nav>
    </header>
  );
}
