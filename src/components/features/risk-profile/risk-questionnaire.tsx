import { useState, useCallback } from 'react'
import { Shield, ArrowLeft, ArrowRight, Check } from 'lucide-react'
import {
  RISK_QUESTIONS,
  computeRiskProfile,
  type RiskAnswer,
  type RiskProfileResult,
} from '../../../features/risk-profile/risk-calculator'
import { RiskResult } from './risk-result'

interface RiskQuestionnaireProps {
  onComplete: (result: RiskProfileResult) => void
}

export function RiskQuestionnaire({ onComplete }: RiskQuestionnaireProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<RiskAnswer[]>([])
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [completed, setCompleted] = useState(false)
  const [result, setResult] = useState<RiskProfileResult | null>(null)

  const currentQuestion = RISK_QUESTIONS[currentIndex]
  const totalQuestions = RISK_QUESTIONS.length
  const progress = ((currentIndex + 1) / totalQuestions) * 100

  const handleSelect = useCallback(
    (score: number) => {
      setSelectedOption(score)
    },
    [],
  )

  const handleNext = useCallback(() => {
    if (selectedOption === null) return

    const newAnswers = [
      ...answers.filter((a) => a.questionId !== currentQuestion.id),
      { questionId: currentQuestion.id, score: selectedOption },
    ]
    setAnswers(newAnswers)

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1)
      setSelectedOption(null)
    } else {
      const profile = computeRiskProfile(newAnswers)
      setResult(profile)
      setCompleted(true)
      onComplete(profile)
    }
  }, [selectedOption, answers, currentQuestion.id, currentIndex, totalQuestions, onComplete])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
      const prevAnswer = answers.find((a) => a.questionId === RISK_QUESTIONS[currentIndex - 1].id)
      setSelectedOption(prevAnswer?.score ?? null)
    }
  }, [currentIndex, answers])

  if (completed && result) {
    return <RiskResult result={result} />
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)]/10">
          <Shield size={32} className="text-[var(--primary)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--foreground)]">Risk Profile Assessment</h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Answer 10 questions to determine your investment risk profile.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
          <span>Question {currentIndex + 1} of {totalQuestions}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">
          {currentQuestion.question}
        </h3>

        <div className="mt-6 space-y-3">
          {currentQuestion.options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleSelect(option.score)}
              className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-all ${
                selectedOption === option.score
                  ? 'border-[var(--primary)] bg-[var(--primary)]/5 ring-1 ring-[var(--primary)]'
                  : 'border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--muted)]'
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  selectedOption === option.score
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'border-[var(--border)]'
                }`}
              >
                {selectedOption === option.score && <Check size={12} />}
              </span>
              <span className="text-sm text-[var(--foreground)]">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)] disabled:opacity-50"
        >
          <ArrowLeft size={16} />
          Previous
        </button>

        <button
          onClick={handleNext}
          disabled={selectedOption === null}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90 disabled:opacity-50"
        >
          {currentIndex < totalQuestions - 1 ? 'Next' : 'See Results'}
          {currentIndex < totalQuestions - 1 ? <ArrowRight size={16} /> : <Check size={16} />}
        </button>
      </div>

      <div className="flex justify-center gap-1.5">
        {RISK_QUESTIONS.map((_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full transition-colors ${
              i <= currentIndex ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
