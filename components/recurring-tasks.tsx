"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Repeat, Plus, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function RecurringTasks() {
  const [recurringTasks, setRecurringTasks] = useState<string[]>([])
  const [newTask, setNewTask] = useState("")

  useEffect(() => {
    // Load recurring tasks from localStorage
    const allKeys = Object.keys(localStorage)
    const plannerKeys = allKeys.filter((key) => key.startsWith("planner-"))

    const allRecurringTasks = new Set<string>()

    plannerKeys.forEach((key) => {
      const data = localStorage.getItem(key)
      if (data) {
        try {
          const parsedData = JSON.parse(data)
          if (parsedData.recurringTasks && Array.isArray(parsedData.recurringTasks)) {
            parsedData.recurringTasks.forEach((task: string) => {
              if (task) allRecurringTasks.add(task)
            })
          }
        } catch (e) {
          console.error("Error parsing data for key:", key)
        }
      }
    })

    setRecurringTasks(Array.from(allRecurringTasks))
  }, [])

  const addRecurringTask = () => {
    if (!newTask.trim()) return

    if (!recurringTasks.includes(newTask)) {
      setRecurringTasks([...recurringTasks, newTask])
      setNewTask("")
      toast({
        title: "Task added",
        description: `"${newTask}" added to recurring tasks.`,
      })
    } else {
      toast({
        title: "Task already exists",
        description: "This task is already in your recurring tasks list.",
        variant: "destructive",
      })
    }
  }

  const removeRecurringTask = (task: string) => {
    setRecurringTasks(recurringTasks.filter((t) => t !== task))

    // Remove from all planners
    const allKeys = Object.keys(localStorage)
    const plannerKeys = allKeys.filter((key) => key.startsWith("planner-"))

    plannerKeys.forEach((key) => {
      const data = localStorage.getItem(key)
      if (data) {
        try {
          const parsedData = JSON.parse(data)
          if (parsedData.recurringTasks && Array.isArray(parsedData.recurringTasks)) {
            parsedData.recurringTasks = parsedData.recurringTasks.filter((t: string) => t !== task)
            localStorage.setItem(key, JSON.stringify(parsedData))
          }
        } catch (e) {
          console.error("Error updating data for key:", key)
        }
      }
    })

    toast({
      title: "Task removed",
      description: `"${task}" removed from recurring tasks.`,
    })
  }

  const addToToday = (task: string) => {
    const today = new Date().toISOString().split("T")[0]
    const savedData = localStorage.getItem(`planner-${today}`)

    if (savedData) {
      const parsedData = JSON.parse(savedData)

      // Try to add to Must Do first, then Second Priority, then Extra Time
      let added = false

      if (parsedData.mustDoItems) {
        for (let i = 0; i < parsedData.mustDoItems.length; i++) {
          if (!parsedData.mustDoItems[i].text) {
            parsedData.mustDoItems[i].text = task
            added = true
            break
          }
        }
      }

      if (!added && parsedData.secondPriorityItems) {
        for (let i = 0; i < parsedData.secondPriorityItems.length; i++) {
          if (!parsedData.secondPriorityItems[i].text) {
            parsedData.secondPriorityItems[i].text = task
            added = true
            break
          }
        }
      }

      if (!added && parsedData.extraTimeItems) {
        for (let i = 0; i < parsedData.extraTimeItems.length; i++) {
          if (!parsedData.extraTimeItems[i].text) {
            parsedData.extraTimeItems[i].text = task
            added = true
            break
          }
        }
      }

      if (added) {
        // Make sure the task is marked as recurring
        if (!parsedData.recurringTasks) {
          parsedData.recurringTasks = []
        }
        if (!parsedData.recurringTasks.includes(task)) {
          parsedData.recurringTasks.push(task)
        }

        localStorage.setItem(`planner-${today}`, JSON.stringify(parsedData))

        toast({
          title: "Task added to today",
          description: `"${task}" added to today's planner.`,
        })
      } else {
        toast({
          title: "No space available",
          description: "All task slots are filled. Clear some space first.",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "No planner for today",
        description: "Create today's planner first.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Repeat className="mr-2 h-5 w-5" />
          Recurring Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex mb-4">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a recurring task"
            className="flex-1 border rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-200"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addRecurringTask()
              }
            }}
          />
          <Button onClick={addRecurringTask} className="rounded-l-none">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {recurringTasks.length > 0 ? (
          <div className="space-y-2">
            {recurringTasks.map((task) => (
              <div key={task} className="flex justify-between items-center p-2 hover:bg-gray-100 rounded">
                <span>{task}</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => addToToday(task)} title="Add to today's planner">
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRecurringTask(task)}
                    title="Remove recurring task"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">No recurring tasks found</p>
        )}
      </CardContent>
    </Card>
  )
}

