"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function PlannerHistory() {
  const [savedDates, setSavedDates] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    // Get all keys from localStorage that start with "planner-"
    const plannerKeys = Object.keys(localStorage).filter((key) => key.startsWith("planner-"))

    // Extract dates from keys
    const dates = plannerKeys.map((key) => key.replace("planner-", ""))

    // Sort dates in descending order (newest first)
    dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    setSavedDates(dates)
  }, [])

  const loadPlanner = (date: string) => {
    router.push(`/?date=${date}`)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="mr-2 h-5 w-5" />
          Planner History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {savedDates.length > 0 ? (
          <div className="space-y-2">
            {savedDates.map((date) => (
              <div
                key={date}
                className="flex justify-between items-center p-2 hover:bg-gray-100 rounded cursor-pointer"
                onClick={() => loadPlanner(date)}
              >
                <span>{format(new Date(date), "MMMM d, yyyy")}</span>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">No saved planners found</p>
        )}
      </CardContent>
    </Card>
  )
}

