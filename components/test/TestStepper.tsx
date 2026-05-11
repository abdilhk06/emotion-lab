import type { TestSection } from "@/lib/data/questions";

type TestStepperProps = {
  sections: TestSection[];
  currentIndex: number;
};

export function TestStepper({ sections, currentIndex }: TestStepperProps) {
  return (
    <nav className="test-stepper" aria-label="Progression des sections">
      {sections.map((section, index) => {
        const state = index < currentIndex ? "done" : index === currentIndex ? "active" : "todo";

        return (
          <span key={section.id} className={`test-stepper-pill is-${state}`}>
            {index + 1}
          </span>
        );
      })}
    </nav>
  );
}
