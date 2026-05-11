'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QuestionBlock, type AnswerValue } from "@/components/test/QuestionBlock";
import { TestHeader } from "@/components/test/TestHeader";
import { TestNavigation } from "@/components/test/TestNavigation";
import { TestStepper } from "@/components/test/TestStepper";
import { TEST_SECTIONS } from "@/lib/data/questions";

const STORAGE_KEY = "emotionlab_test_answers";

type AnswersState = Record<string, AnswerValue>;

function isAnswered(value: AnswerValue | undefined): boolean {
  if (typeof value === "number") {
    return value >= 1 && value <= 5;
  }
  if (typeof value === "string") {
    return value.length > 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return false;
}

export default function TestPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<AnswersState>(() => {
    if (typeof window === "undefined") {
      return {};
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    try {
      return JSON.parse(raw) as AnswersState;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return {};
    }
  });
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  }, [answers]);

  const totalQuestions = useMemo(
    () => TEST_SECTIONS.reduce((sum, section) => sum + section.questions.length, 0),
    []
  );

  const answeredCount = useMemo(() => {
    const allQuestions = TEST_SECTIONS.flatMap((section) => section.questions);
    return allQuestions.reduce((sum, question) => (isAnswered(answers[question.id]) ? sum + 1 : sum), 0);
  }, [answers]);

  const currentSection = TEST_SECTIONS[currentSectionIndex];
  const isCurrentSectionComplete = currentSection.questions.every((question) => {
    if (question.required === false) {
      return true;
    }
    return isAnswered(answers[question.id]);
  });

  const progressPercent = Math.min((answeredCount / totalQuestions) * 100, 100);

  const handleAnswerChange = (questionId: string, value: AnswerValue) => {
    setAnswers((previous) => ({ ...previous, [questionId]: value }));
  };

  const handlePrevious = () => {
    setCurrentSectionIndex((previous) => Math.max(previous - 1, 0));
  };

  const handleNext = () => {
    if (!isCurrentSectionComplete) {
      return;
    }
    if (currentSectionIndex === TEST_SECTIONS.length - 1) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
      router.push("/test/hobbies");
      return;
    }
    setCurrentSectionIndex((previous) => previous + 1);
  };

  return (
    <main className="test-page">
      <div className="test-shell">
        <TestHeader progressText={`${answeredCount} / ${totalQuestions}`} />
        <div className="test-progress-bar" aria-hidden="true">
          <div className="fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <TestStepper sections={TEST_SECTIONS} currentIndex={currentSectionIndex} />
        <section className="test-section-head" aria-labelledby="test-section-title">
          <h1 id="test-section-title">{currentSection.title}</h1>
          <p>{currentSection.description}</p>
        </section>
        <div className="test-body">
          {currentSection.questions.map((question, index) => (
            <QuestionBlock
              key={question.id}
              question={question}
              index={index}
              value={answers[question.id]}
              onChange={handleAnswerChange}
            />
          ))}
        </div>
        <TestNavigation
          isFirst={currentSectionIndex === 0}
          isLast={currentSectionIndex === TEST_SECTIONS.length - 1}
          canProceed={isCurrentSectionComplete}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      </div>
    </main>
  );
}
