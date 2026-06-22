import { useEffect, useState } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import { db } from './services/db'
import { LoadingState } from './components/shared/loading-state'

function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const timeout = setTimeout(() => {
      if (!cancelled) {
        console.warn('DB check timed out after 3s, proceeding')
        setReady(true)
      }
    }, 3000)

    db.userPreference
      .get('riskProfile')
      .then((profile) => {
        if (cancelled) return
        clearTimeout(timeout)
        if (!profile && window.location.pathname !== '/risk-profile') {
          window.history.replaceState({}, '', '/risk-profile')
        }
        setReady(true)
      })
      .catch((err) => {
        if (cancelled) return
        clearTimeout(timeout)
        console.warn('DB check failed, proceeding:', err)
        setReady(true)
      })

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingState rows={1} />
      </div>
    )
  }

  return <RouterProvider router={router} />
}

export default App
