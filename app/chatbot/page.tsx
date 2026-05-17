import { AppLayout } from "@/components/app-layout/AppLayout";
import { PlanningFlow } from "@/components/chatbot/planning/PlanningFlow";

export default function ChatbotPage() {
  return (
    <AppLayout title="Chatbot">
      <PlanningFlow />
    </AppLayout>
  );
}
