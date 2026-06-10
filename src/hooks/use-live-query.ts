import { useState, useEffect } from 'react'

export function useLiveQuery<T>(
  query: () => Promise<T>,
  deps: unknown[],
): T | undefined {
  const [data, setData] = useState<T>()

  useEffect(() => {
    let cancelled = false
    query().then((result) => {
      if (!cancelled) setData(result)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return data
}
