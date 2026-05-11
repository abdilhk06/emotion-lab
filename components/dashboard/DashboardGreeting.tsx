type DashboardGreetingProps = {
  pseudo: string;
  mbtiCode: string | null;
  mbtiName: string | null;
};

export function DashboardGreeting({ pseudo, mbtiCode, mbtiName }: DashboardGreetingProps) {
  return (
    <header className="dashboard-greeting-card">
      <p className="dashboard-greeting-label">Bonjour,</p>
      <h2>{pseudo}</h2>
      <div className="dashboard-greeting-line">
        <span className="dashboard-greeting-badge">{mbtiCode ? `${mbtiCode} · ${mbtiName ?? "Profil detecte"}` : "Profil MBTI a completer"}</span>
      </div>
      <style jsx>{`
        .dashboard-greeting-card {
          background: linear-gradient(132deg, #7e3d5e, #8a6889 50%, #5f6f8d 80%, #2e8bbf);
          color: #fff;
          border-radius: 20px;
          padding: 22px;
          box-shadow: 0 18px 36px rgba(41, 40, 65, 0.2);
        }

        .dashboard-greeting-label {
          margin: 0;
          opacity: 0.9;
        }

        h2 {
          margin: 6px 0 12px;
          font-size: clamp(30px, 4vw, 42px);
        }

        .dashboard-greeting-line {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .dashboard-greeting-badge {
          display: inline-flex;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.18);
          border: 1px solid rgba(255, 255, 255, 0.38);
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 600;
        }
      `}</style>
    </header>
  );
}
