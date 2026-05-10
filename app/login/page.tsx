import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthVisualPanel } from "@/components/auth/AuthVisualPanel";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return <AuthLayout visual={<AuthVisualPanel />}><LoginForm /></AuthLayout>;
}
