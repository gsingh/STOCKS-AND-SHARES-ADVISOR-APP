import { useEffect, useState } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import { db } from './services/db'
import { LoadingState } from './components/shared/loading-state'

function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    db.userPreference
      .get('riskProfile')
      .then((profile) => {
        if (!profile && window.location.pathname !== '/risk-profile') {
          window.history.replaceState({}, '', '/risk-profile')
        }
        setReady(true)
      })
      .catch(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <LoadingState rows={1} />
      </div>
    )
  }

  return <RouterProvider router={router} />
}

export default App
