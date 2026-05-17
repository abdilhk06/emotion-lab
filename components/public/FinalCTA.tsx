import Link from "next/link";

export function FinalCTA(){return <section className="cta-final"><h2>Prête à mieux te connaître ?</h2><p>Ton compte se crée en 2 minutes. Tes données restent privées.</p><div style={{display:"flex",gap:"12px",justifyContent:"center",flexWrap:"wrap"}}><Link className="btn btn-lg" href="/register">Créer mon compte</Link><Link className="btn btn-lg" href="/login" style={{background:"transparent",color:"#fff",border:"1.5px solid rgba(255,255,255,.5)"}}>Me connecter</Link></div></section>}
