import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthVisualPanel } from "@/components/auth/AuthVisualPanel";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return <AuthLayout visual={<AuthVisualPanel />}><RegisterForm /></AuthLayout>;
}
