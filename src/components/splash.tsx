'use client'

import { useEffect, useState } from 'react'

export function SplashLoading({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setTimeout(() => {
      setIsMounted(true)
    }, 0)
  }, [])

  return (
    <>
      {isMounted ? (
        children
      ) : (
        <div className="flex items-center justify-center h-screen w-screen bg-background text-foreground">Loading...</div>
      )}
    </>
  )
}
