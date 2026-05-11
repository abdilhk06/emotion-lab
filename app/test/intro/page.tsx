import { TestHeader } from "@/components/test/TestHeader";
import { TestIntroCard } from "@/components/test/TestIntroCard";

export default function TestIntroPage() {
  return (
    <main className="test-intro-page">
      <div className="test-intro-shell">
        <TestHeader />
        <div className="test-intro-content">
          <TestIntroCard />
        </div>
      </div>
    </main>
  );
}
