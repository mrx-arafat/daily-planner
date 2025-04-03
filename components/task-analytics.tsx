"use client"

import { useState, useEffect } from "react"
import { format, subDays } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function TaskAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<any[]>([])
  const [timeRange, setTimeRange] = useState<"7days" | "30days">("7days")

  useEffect(() => {
    // Calculate the date range
    const endDate = new Date()
    const startDate = subDays(endDate, timeRange === "7days" ? 7 : 30)

    // Collect data from localStorage
    const data = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0]
      const savedData = localStorage.getItem(`planner-${dateStr}`)

      let completedTasks = 0
      let totalTasks = 0
      let totalTimeEstimate = 0

      if (savedData) {
        const parsedData = JSON.parse(savedData)

        // Count completed tasks
        if (parsedData.mustDoItems) {
          completedTasks += parsedData.mustDoItems.filter((item) => item.completed && item.text).length
          totalTasks += parsedData.mustDoItems.filter((item) => item.text).length
        }

        if (parsedData.secondPriorityItems) {
          completedTasks += parsedData.secondPriorityItems.filter((item) => item.completed && item.text).length
          totalTasks += parsedData.secondPriorityItems.filter((item) => item.text).length
        }

        if (parsedData.extraTimeItems) {
          completedTasks += parsedData.extraTimeItems.filter((item) => item.completed && item.text).length
          totalTasks += parsedData.extraTimeItems.filter((item) => item.text).length
        }

        // Calculate total time estimates
        if (parsedData.timeEstimates) {
          totalTimeEstimate = Object.values(parsedData.timeEstimates).reduce(
            (sum: number, val: any) => sum + (Number.parseInt(val) || 0),
            0,
          )
        }
      }

      data.push({
        date: format(currentDate, "MM/dd"),
        fullDate: dateStr,
        completedTasks,
        totalTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        totalTimeEstimate: Math.round((totalTimeEstimate / 60) * 10) / 10, // Convert to hours with 1 decimal
      })

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
    }

    setAnalyticsData(data)
  }, [timeRange])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Task Analytics</span>
          <Tabs defaultValue="7days" value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
            <TabsList>
              <TabsTrigger value="7days">7 Days</TabsTrigger>
              <TabsTrigger value="30days">30 Days</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="completion">
          <TabsList className="mb-4">
            <TabsTrigger value="completion">Completion Rate</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="time">Time Estimates</TabsTrigger>
          </TabsList>

          <TabsContent value="completion">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis unit="%" domain={[0, 100]} />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Completion Rate"]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Bar dataKey="completionRate" fill="#8884d8" name="Completion Rate" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="tasks">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalTasks" fill="#82ca9d" name="Total Tasks" />
                  <Bar dataKey="completedTasks" fill="#8884d8" name="Completed Tasks" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="time">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis unit="h" />
                  <Tooltip
                    formatter={(value) => [`${value} hours`, "Estimated Time"]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Bar dataKey="totalTimeEstimate" fill="#ffc658" name="Time Estimate" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

