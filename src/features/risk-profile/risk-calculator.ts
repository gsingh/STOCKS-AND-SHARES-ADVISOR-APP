export interface RiskQuestion {
  id: string
  question: string
  options: { label: string; score: number }[]
}

export interface RiskAnswer {
  questionId: string
  score: number
}

export type RiskProfileType = 'conservative' | 'moderate' | 'aggressive'

export type StylePreference = 'growth' | 'value' | 'dividend' | 'blend'

export interface RiskProfileResult {
  totalScore: number
  profile: RiskProfileType
  stylePreference: StylePreference
  explanation: string
  recommendedApproach: string
}

export const RISK_QUESTIONS: RiskQuestion[] = [
  {
    id: 'experience',
    question: 'How many years of experience do you have investing in stocks or mutual funds?',
    options: [
      { label: 'None', score: 0 },
      { label: 'Less than 1 year', score: 10 },
      { label: '1–3 years', score: 20 },
      { label: '3–7 years', score: 30 },
      { label: '7+ years', score: 40 },
    ],
  },
  {
    id: 'time_horizon',
    question: 'What is your expected investment time horizon for this portfolio?',
    options: [
      { label: 'Less than 1 year', score: 0 },
      { label: '1–3 years', score: 15 },
      { label: '3–7 years', score: 30 },
      { label: '7+ years', score: 45 },
    ],
  },
  {
    id: 'risk_tolerance',
    question: 'Which best describes your attitude toward investment risk?',
    options: [
      { label: 'I avoid risk and prefer capital preservation', score: 0 },
      { label: 'I accept minimal risk for steady returns', score: 15 },
      { label: 'I balance risk and reward equally', score: 30 },
      { label: 'I am comfortable with above-average risk', score: 45 },
      { label: 'I seek high returns regardless of risk', score: 60 },
    ],
  },
  {
    id: 'income_stability',
    question: 'How stable is your current income?',
    options: [
      { label: 'Unstable / Variable', score: 5 },
      { label: 'Moderately stable', score: 15 },
      { label: 'Stable with steady growth', score: 25 },
      { label: 'Highly stable with surplus', score: 35 },
    ],
  },
  {
    id: 'loss_reaction',
    question: 'If your portfolio dropped 20% in a month, what would you do?',
    options: [
      { label: 'Sell everything to prevent further loss', score: 0 },
      { label: 'Sell a portion to reduce exposure', score: 10 },
      { label: 'Hold and wait for recovery', score: 25 },
      { label: 'Buy more to take advantage of lower prices', score: 40 },
    ],
  },
  {
    id: 'investment_knowledge',
    question: 'How would you rate your knowledge of financial markets and investments?',
    options: [
      { label: 'None / Very limited', score: 0 },
      { label: 'Basic understanding', score: 15 },
      { label: 'Good working knowledge', score: 30 },
      { label: 'Expert / Professional', score: 45 },
    ],
  },
  {
    id: 'goal_type',
    question: 'What is the primary goal for this portfolio?',
    options: [
      { label: 'Wealth preservation / Safety', score: 5 },
      { label: 'Regular income generation', score: 15 },
      { label: 'Long-term wealth growth', score: 30 },
      { label: 'Aggressive wealth accumulation', score: 45 },
    ],
  },
  {
    id: 'portfolio_size',
    question: 'What portion of your total investable assets does this portfolio represent?',
    options: [
      { label: 'More than 75%', score: 5 },
      { label: '50–75%', score: 15 },
      { label: '25–50%', score: 25 },
      { label: 'Less than 25%', score: 35 },
    ],
  },
  {
    id: 'leverage_attitude',
    question: 'What is your attitude toward using leverage (borrowing) for investments?',
    options: [
      { label: 'Would never use leverage', score: 0 },
      { label: 'Would use modest leverage occasionally', score: 20 },
      { label: 'Comfortable using leverage strategically', score: 40 },
    ],
  },
  {
    id: 'volatility_reaction',
    question: 'How do you typically react to market volatility?',
    options: [
      { label: 'Panic and consider exiting positions', score: 0 },
      { label: 'Feel anxious but try to stay the course', score: 15 },
      { label: 'View it as normal market behavior', score: 30 },
      { label: 'See it as opportunity to rebalance', score: 45 },
    ],
  },
]

const MAX_SCORE = RISK_QUESTIONS.reduce(
  (sum, q) => sum + Math.max(...q.options.map((o) => o.score)),
  0,
)

export function computeRiskScore(answers: RiskAnswer[]): number {
  const total = answers.reduce((sum, a) => sum + a.score, 0)
  return Math.round((total / MAX_SCORE) * 100)
}

export function getProfile(score: number): RiskProfileType {
  if (score <= 30) return 'conservative'
  if (score <= 60) return 'moderate'
  return 'aggressive'
}

export function getStylePreference(
  score: number,
  answers: RiskAnswer[],
): StylePreference {
  const goalAnswer = answers.find((a) => a.questionId === 'goal_type')
  const knowledgeAnswer = answers.find((a) => a.questionId === 'investment_knowledge')

  if (score <= 30) return 'dividend'
  if (score >= 70) return 'growth'

  if (goalAnswer && goalAnswer.score >= 30 && knowledgeAnswer && knowledgeAnswer.score >= 30) {
    return 'growth'
  }
  if (goalAnswer && goalAnswer.score <= 15) return 'dividend'
  if (knowledgeAnswer && knowledgeAnswer.score >= 20) return 'value'

  return 'blend'
}

export function getProfileExplanation(profile: RiskProfileType): string {
  switch (profile) {
    case 'conservative':
      return 'You prefer capital preservation and steady returns over high growth. Your portfolio should focus on high-quality bonds, blue-chip dividend stocks, and diversified debt instruments.'
    case 'moderate':
      return 'You seek a balanced approach between growth and safety. Your portfolio should include a mix of equity and debt, with diversification across sectors and market caps.'
    case 'aggressive':
      return 'You are comfortable with significant volatility in pursuit of higher returns. Your portfolio should be equity-heavy with exposure to growth sectors and emerging opportunities.'
  }
}

export function getRecommendedApproach(profile: RiskProfileType, style: StylePreference): string {
  const profiles: Record<RiskProfileType, string> = {
    conservative: 'Allocate 20–30% to equity (large-cap, dividend-focused) and 70–80% to debt and fixed-income instruments.',
    moderate: 'Allocate 50–65% to equity (diversified across caps and sectors) and 35–50% to debt.',
    aggressive: 'Allocate 75–90% to equity (with exposure to mid/small-cap and growth sectors) and 10–25% to debt.',
  }

  const styles: Record<StylePreference, string> = {
    growth: ' Focus on companies with strong earnings growth and high reinvestment rates.',
    value: ' Focus on undervalued companies with strong fundamentals and margin of safety.',
    dividend: ' Focus on companies with consistent dividend payouts and stable cash flows.',
    blend: ' Maintain a diversified approach across growth and value styles.',
  }

  return profiles[profile] + styles[style]
}

export function computeRiskProfile(answers: RiskAnswer[]): RiskProfileResult {
  const totalScore = computeRiskScore(answers)
  const profile = getProfile(totalScore)
  const stylePreference = getStylePreference(totalScore, answers)
  const explanation = getProfileExplanation(profile)
  const recommendedApproach = getRecommendedApproach(profile, stylePreference)

  return { totalScore, profile, stylePreference, explanation, recommendedApproach }
}
