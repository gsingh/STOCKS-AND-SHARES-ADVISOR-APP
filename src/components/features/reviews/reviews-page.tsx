import { useState, useEffect, useCallback } from 'react'
import { ClipboardCheck, Plus, History } from 'lucide-react'
import { db, type ReviewRow } from '../../../services/db'
import { formatDate } from '../../../lib/format'
import { LoadingState } from '../../shared/loading-state'
import { ErrorState } from '../../shared/error-state'
import { ReviewWizard } from './review-wizard'
import { ReviewAlerts } from './review-alerts'

type ViewMode = 'list' | 'wizard' | 'view'

export function ReviewsPage() {
  const [mode, setMode] = useState<ViewMode>('list')
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadReviews = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const all = await db.review.orderBy('createdAt').reverse().toArray()
      setReviews(all)
    } catch (err) {
      console.error('Failed to load reviews:', err)
      setError('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  const handleSave = useCallback(async (data: Omit<ReviewRow, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    await db.review.add({ ...data, createdAt: now, updatedAt: now } as ReviewRow)
    await loadReviews()
    setMode('list')
  }, [loadReviews])

  if (mode === 'wizard') {
    return <ReviewWizard onSave={handleSave} onCancel={() => setMode('list')} />
  }

  if (loading) return <LoadingState rows={4} />
  if (error) return <ErrorState message={error} onRetry={loadReviews} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Portfolio Reviews</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Track portfolio drift, exposure, role-fit, and benchmark performance
          </p>
        </div>
        <button
          onClick={() => setMode('wizard')}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90"
        >
          <Plus size={18} />
          New Review
        </button>
      </div>

      <ReviewAlerts reviews={reviews} onDismiss={() => loadReviews()} />

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-[var(--border)] p-12 text-center">
          <ClipboardCheck size={48} className="text-[var(--muted-foreground)]" />
          <div>
            <p className="text-lg font-medium text-[var(--foreground)]">
              No reviews yet
            </p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Start your first portfolio review to track drift, exposure, and performance.
            </p>
          </div>
          <button
            onClick={() => setMode('wizard')}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90"
          >
            <Plus size={18} />
            Start First Review
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:bg-[var(--muted)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <History size={20} className="text-[var(--muted-foreground)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      Review — {formatDate(review.date)}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Status: {review.status}
                      {review.nextReviewDate && ` · Next: ${formatDate(review.nextReviewDate)}`}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    review.status === 'completed'
                      ? 'bg-[var(--score-green-bg)] text-[var(--score-green)]'
                      : 'bg-[var(--score-amber-bg)] text-[var(--score-amber)]'
                  }`}
                >
                  {review.status === 'completed' ? 'Completed' : 'Draft'}
                </span>
              </div>
              {review.driftResults && (
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--muted-foreground)]">
                  <span>
                    Drift items: {Object.keys(review.driftResults).length}
                  </span>
                  {review.exposureResults && (
                    <span>
                      Exposures: {Object.keys(review.exposureResults).length}
                    </span>
                  )}
                  {review.roleFitResults && (
                    <span>
                      Role assessments: {Object.keys(review.roleFitResults).length}
                    </span>
                  )}
                  {review.benchmarkResults && (
                    <span>
                      Benchmarks: {Object.keys(review.benchmarkResults).length}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
