import { AppLayout } from "@/components/app-layout/AppLayout";
import { PlanningFlow } from "@/components/chatbot/planning/PlanningFlow";

export default function ChatbotPage() {
  return (
    <AppLayout title="Chatbot">
      <div className="chatbot-page-frame">
        <div className="chatbot-page-shell">
          <PlanningFlow />
        </div>
      </div>
    </AppLayout>
  );
}
