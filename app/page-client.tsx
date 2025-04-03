"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import DailyPlanner from "@/components/daily-planner"

export default function HomeClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const date = searchParams.get("date")

  // If a date is provided in the URL, load that date's planner
  useEffect(() => {
    if (date) {
      // The date will be used by the DailyPlanner component
      // We don't need to do anything here
    }
  }, [date])

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <DailyPlanner initialDate={date || undefined} />
    </main>
  )
}

