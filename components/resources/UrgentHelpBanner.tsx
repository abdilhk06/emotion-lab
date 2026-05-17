"use client";

export function UrgentHelpBanner() {
  return (
    <section className="urgent-banner" role="note" aria-label="Aide urgente">
      <h2>Tu traverses un moment tres difficile ?</h2>
      <p>
        Ces numeros publics marocains sont <strong>gratuits, confidentiels, et disponibles 24/24</strong>. N&apos;hesite jamais a les
        appeler.
      </p>
      <div className="urgent-numbers">
        <a className="urgent-num" href="tel:0801000180">
          <span className="num-icon" aria-hidden="true">
            📞
          </span>
          <strong>0801 000 180</strong>
          <span>SOS Detresse Jeunes</span>
        </a>
        <a className="urgent-num" href="tel:141">
          <span className="num-icon" aria-hidden="true">
            🚑
          </span>
          <strong>141</strong>
          <span>SAMU (urgences medicales)</span>
        </a>
        <a className="urgent-num" href="tel:+212537704444">
          <span className="num-icon" aria-hidden="true">
            💬
          </span>
          <strong>0537 70 44 44</strong>
          <span>Ecoute Maroc</span>
        </a>
      </div>
      <style jsx>{`
        .urgent-banner {
          background: linear-gradient(135deg, var(--rose-pale), #fbd7dd);
          border: 1.5px solid #f2adb2;
          border-radius: 18px;
          padding: 22px;
        }

        .urgent-banner h2 {
          margin: 0 0 8px;
          color: var(--plum);
          font-size: 16px;
        }

        .urgent-banner p {
          margin: 0 0 14px;
          color: var(--texte-gris);
          font-size: 13px;
        }

        .urgent-numbers {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .urgent-num {
          background: rgba(255, 255, 255, 0.7);
          border-radius: 10px;
          padding: 10px 12px;
          display: grid;
          text-decoration: none;
          color: var(--texte);
          border: 1px solid rgba(126, 61, 94, 0.08);
          transition: transform 120ms ease, box-shadow 120ms ease;
        }

        .urgent-num:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(26, 26, 46, 0.08);
        }

        .urgent-num strong {
          color: var(--plum);
          font-size: 15px;
          line-height: 1.2;
        }

        .num-icon {
          font-size: 18px;
          line-height: 1;
        }

        .urgent-num span {
          font-size: 11px;
          color: var(--texte-gris);
        }

        @media (max-width: 800px) {
          .urgent-numbers {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
