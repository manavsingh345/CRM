"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"

export default function AuthCallbackPage() {
  const router = useRouter()
  const { refreshUser } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Refresh user data after successful OAuth
        await refreshUser()
        router.push("/")
      } catch (error) {
        console.error("Auth callback error:", error)
        router.push("/login")
      }
    }

    handleCallback()
  }, [router, refreshUser])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-muted-foreground">Completing sign in...</span>
      </div>
    </div>
  )
}
