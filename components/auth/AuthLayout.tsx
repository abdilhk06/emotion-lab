import type { ReactNode } from "react";
export function AuthLayout({ visual, children }: { visual: ReactNode; children: ReactNode }) { return <div className="auth-layout">{visual}<div className="auth-form-wrap">{children}</div></div>; }
