'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QuestionBlock, type AnswerValue } from "@/components/test/QuestionBlock";
import { TestHeader } from "@/components/test/TestHeader";
import { TestNavigation } from "@/components/test/TestNavigation";
import { TestStepper } from "@/components/test/TestStepper";
import { TEST_SECTIONS } from "@/lib/data/questions";
import { clearLegacyTestFlowStorage, getUserTestFlowStorageKey } from "@/lib/test-flow-storage";
import { getSupabaseClient } from "@/lib/supabase/client";

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
  const [userId, setUserId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswersState>({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  useEffect(() => {
    let active = true;

    const loadUserAnswers = async () => {
      try {
        clearLegacyTestFlowStorage();
        const supabase = getSupabaseClient();
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          router.replace("/login");
          return;
        }

        const storageKey = getUserTestFlowStorageKey(user.id, "answers");
        const raw = localStorage.getItem(storageKey);
        let nextAnswers: AnswersState = {};

        if (raw) {
          try {
            nextAnswers = JSON.parse(raw) as AnswersState;
          } catch {
            localStorage.removeItem(storageKey);
          }
        }

        if (active) {
          setUserId(user.id);
          setAnswers(nextAnswers);
        }
      } catch {
        if (active) router.replace("/login");
      }
    };

    void loadUserAnswers();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const storageKey = getUserTestFlowStorageKey(userId, "answers");
    localStorage.setItem(storageKey, JSON.stringify(answers));
  }, [answers, userId]);

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
      if (userId) {
        localStorage.setItem(getUserTestFlowStorageKey(userId, "answers"), JSON.stringify(answers));
      }
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
