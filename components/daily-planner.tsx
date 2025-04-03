"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { format } from "date-fns"
import { Save, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface DailyPlannerProps {
  initialDate?: string
}

export default function DailyPlanner({ initialDate }: DailyPlannerProps) {
  // Replace the startHour state with this to add more options
  const [viewMode, setViewMode] = useState<"all" | "custom">("all")
  const [date, setDate] = useState(initialDate || new Date().toISOString().split("T")[0])
  const [startHour, setStartHour] = useState(0) // Default start at midnight
  const [endHour, setEndHour] = useState(23) // Default end at 11pm
  const [scheduleItems, setScheduleItems] = useState<Record<string, string>>({})
  const [mustDoItems, setMustDoItems] = useState(Array(5).fill({ text: "", completed: false }))
  const [secondPriorityItems, setSecondPriorityItems] = useState(Array(4).fill({ text: "", completed: false }))
  const [extraTimeItems, setExtraTimeItems] = useState(Array(4).fill({ text: "", completed: false }))
  const [selfCareItems, setSelfCareItems] = useState(Array(3).fill({ text: "", completed: false }))
  const [gratefulItems, setGratefulItems] = useState(["", "", ""])
  const [taskStatus, setTaskStatus] = useState("TO START")

  // Add these new state variables after the other state declarations
  const [autoSave, setAutoSave] = useState(true)
  const [taskTags, setTaskTags] = useState<string[]>(["Work", "Personal", "Health", "Errands", "Learning"])
  const [timeEstimates, setTimeEstimates] = useState<Record<string, number>>({})
  const [recurringTasks, setRecurringTasks] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)

  const printableContentRef = useRef<HTMLDivElement>(null)
  const plannerRef = useRef<HTMLDivElement>(null)

  // Update date when initialDate prop changes
  useEffect(() => {
    if (initialDate) {
      setDate(initialDate)
    }
  }, [initialDate])

  // Load data from local storage when date changes
  useEffect(() => {
    const savedData = localStorage.getItem(`planner-${date}`)
    if (savedData) {
      const parsedData = JSON.parse(savedData)
      setStartHour(parsedData.startHour || 0)
      setEndHour(parsedData.endHour || 23)
      setViewMode(parsedData.viewMode || "all")
      setScheduleItems(parsedData.scheduleItems || {})
      setMustDoItems(parsedData.mustDoItems || Array(5).fill({ text: "", completed: false }))
      setSecondPriorityItems(parsedData.secondPriorityItems || Array(4).fill({ text: "", completed: false }))
      setExtraTimeItems(parsedData.extraTimeItems || Array(4).fill({ text: "", completed: false }))
      setSelfCareItems(parsedData.selfCareItems || Array(3).fill({ text: "", completed: false }))
      setGratefulItems(parsedData.gratefulItems || ["", "", ""])
      setTaskStatus(parsedData.taskStatus || "TO START")
      setTimeEstimates(parsedData.timeEstimates || {})
      setRecurringTasks(parsedData.recurringTasks || [])
    } else {
      // Reset form if no data exists for this date
      setStartHour(0)
      setEndHour(23)
      setViewMode("all")
      setScheduleItems({})
      setMustDoItems(Array(5).fill({ text: "", completed: false }))
      setSecondPriorityItems(Array(4).fill({ text: "", completed: false }))
      setExtraTimeItems(Array(4).fill({ text: "", completed: false }))
      setSelfCareItems(Array(3).fill({ text: "", completed: false }))
      setGratefulItems(["", "", ""])
      setTaskStatus("TO START")
      setTimeEstimates({})
      setRecurringTasks([])
    }
  }, [date])

  // Add this useEffect for auto-saving after the other useEffect hooks
  useEffect(() => {
    let saveTimer: NodeJS.Timeout | null = null

    if (autoSave) {
      saveTimer = setTimeout(() => {
        const dataToSave = {
          startHour,
          endHour,
          viewMode,
          scheduleItems,
          mustDoItems,
          secondPriorityItems,
          extraTimeItems,
          selfCareItems,
          gratefulItems,
          taskStatus,
          timeEstimates,
          recurringTasks,
        }
        localStorage.setItem(`planner-${date}`, JSON.stringify(dataToSave))
        toast({
          title: "Auto-saved",
          description: `Your planner for ${format(new Date(date), "MMMM d, yyyy")} has been auto-saved.`,
          duration: 2000,
        })
      }, 30000) // Auto-save after 30 seconds of inactivity
    }

    return () => {
      if (saveTimer) clearTimeout(saveTimer)
    }
  }, [
    autoSave,
    date,
    startHour,
    endHour,
    viewMode,
    scheduleItems,
    mustDoItems,
    secondPriorityItems,
    extraTimeItems,
    selfCareItems,
    gratefulItems,
    taskStatus,
    timeEstimates,
    recurringTasks,
  ])

  // Update the saveToLocalStorage function to include the new state variables
  const saveToLocalStorage = () => {
    const dataToSave = {
      startHour,
      endHour,
      viewMode,
      scheduleItems,
      mustDoItems,
      secondPriorityItems,
      extraTimeItems,
      selfCareItems,
      gratefulItems,
      taskStatus,
      timeEstimates,
      recurringTasks,
    }
    localStorage.setItem(`planner-${date}`, JSON.stringify(dataToSave))
    toast({
      title: "Saved successfully",
      description: `Your planner for ${format(new Date(date), "MMMM d, yyyy")} has been saved.`,
    })
  }

  // Replace the generateTimeSlots function with this updated version that shows all 24 hours
  const generateTimeSlots = () => {
    const slots = []
    for (let i = 0; i < 24; i++) {
      const hour = (startHour + i) % 24
      const formattedHour = hour === 0 ? "12am" : hour === 12 ? "12pm" : hour < 12 ? `${hour}am` : `${hour - 12}pm`
      slots.push({ hour, display: formattedHour })
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  // Update items in the various lists
  const updateTaskList = (
    list: any[],
    setList: React.Dispatch<React.SetStateAction<any[]>>,
    index: number,
    value: any,
    field = "text",
  ) => {
    const newList = [...list]
    if (field === "completed") {
      newList[index] = { ...newList[index], completed: value }
    } else {
      newList[index] = { ...newList[index], text: value }
    }
    setList(newList)
  }

  // Handle schedule item updates
  const updateScheduleItem = (hour: number, value: string) => {
    setScheduleItems({ ...scheduleItems, [hour]: value })
  }

  // Handle grateful items
  const updateGratefulItem = (index: number, value: string) => {
    const newList = [...gratefulItems]
    newList[index] = value
    setGratefulItems(newList)
  }

  // Add these helper functions after the other helper functions
  const addTimeEstimate = (taskId: string, minutes: number) => {
    setTimeEstimates((prev) => ({
      ...prev,
      [taskId]: minutes,
    }))
  }

  const toggleRecurringTask = (taskText: string) => {
    setRecurringTasks((prev) => {
      if (prev.includes(taskText)) {
        return prev.filter((t) => t !== taskText)
      } else {
        return [...prev, taskText]
      }
    })
  }

  const copyTasksFromPreviousDay = () => {
    const yesterday = new Date(date)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split("T")[0]

    const savedData = localStorage.getItem(`planner-${yesterdayStr}`)
    if (savedData) {
      const parsedData = JSON.parse(savedData)

      // Only copy incomplete tasks
      const incompleteMustDo = (parsedData.mustDoItems || [])
        .filter((item) => !item.completed)
        .map((item) => ({ ...item, completed: false }))

      const incompleteSecondPriority = (parsedData.secondPriorityItems || [])
        .filter((item) => !item.completed)
        .map((item) => ({ ...item, completed: false }))

      const incompleteExtraTime = (parsedData.extraTimeItems || [])
        .filter((item) => !item.completed)
        .map((item) => ({ ...item, completed: false }))

      setMustDoItems((prev) => {
        // Replace empty slots with incomplete tasks
        const newItems = [...prev]
        let incompleteIndex = 0
        for (let i = 0; i < newItems.length && incompleteIndex < incompleteMustDo.length; i++) {
          if (!newItems[i].text) {
            newItems[i] = incompleteMustDo[incompleteIndex]
            incompleteIndex++
          }
        }
        return newItems
      })

      setSecondPriorityItems((prev) => {
        const newItems = [...prev]
        let incompleteIndex = 0
        for (let i = 0; i < newItems.length && incompleteIndex < incompleteSecondPriority.length; i++) {
          if (!newItems[i].text) {
            newItems[i] = incompleteSecondPriority[incompleteIndex]
            incompleteIndex++
          }
        }
        return newItems
      })

      setExtraTimeItems((prev) => {
        const newItems = [...prev]
        let incompleteIndex = 0
        for (let i = 0; i < newItems.length && incompleteIndex < incompleteExtraTime.length; i++) {
          if (!newItems[i].text) {
            newItems[i] = incompleteExtraTime[incompleteIndex]
            incompleteIndex++
          }
        }
        return newItems
      })

      toast({
        title: "Tasks imported",
        description: "Incomplete tasks from yesterday have been added to your planner.",
      })
    } else {
      toast({
        title: "No previous data",
        description: "No planner data found for yesterday.",
        variant: "destructive",
      })
    }
  }

  const exportToImage = async () => {
    try {
      setIsExporting(true)
      // Dynamically import html2canvas
      const html2canvas = (await import("html2canvas")).default

      if (!printableContentRef.current) return

      toast({
        title: "Generating image...",
        description: "Please wait while we prepare your planner image.",
      })

      // Wait a moment for the UI to update with the exporting state
      await new Promise((resolve) => setTimeout(resolve, 100))

      const canvas = await html2canvas(printableContentRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: printableContentRef.current.offsetWidth * 2,
        windowHeight: printableContentRef.current.offsetHeight * 2,
        onclone: (document, element) => {
          // Add print-specific styling to the cloned element
          element.style.width = `${printableContentRef.current?.offsetWidth}px`
          element.style.padding = "20px"
          element.style.boxShadow = "none"

          // Make sure all inputs are visible in the exported image
          const inputs = element.querySelectorAll("input")
          inputs.forEach((input: HTMLInputElement) => {
            input.style.border = "1px solid #e2e8f0"
          })
        },
      })

      const image = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.download = `daily-planner-${format(new Date(date), "yyyy-MM-dd")}.png`
      link.href = image
      link.click()

      toast({
        title: "Success!",
        description: "Your planner has been exported as an image.",
      })
    } catch (error) {
      console.error("Error exporting planner:", error)
      toast({
        title: "Export failed",
        description: "There was an error exporting your planner.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const dayOfWeek = date ? new Date(date).getDay() : null

  return (
    <div ref={plannerRef} className="max-w-4xl mx-auto p-6 bg-white font-serif shadow-md rounded-lg">
      {/* Printable content - excludes smart features */}
      <div ref={printableContentRef} className="bg-white">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-light text-gray-600">DAILY PERSONAL PLANNER</h1>
          {!isExporting && (
            <div className="flex gap-2">
              <Button onClick={exportToImage} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button onClick={saveToLocalStorage} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center flex-1">
            <span className="mr-2 text-gray-600">DATE:</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border-b border-gray-400 px-2 py-1 focus:outline-none bg-transparent flex-1"
            />
          </div>

          <div className="flex space-x-4 ml-4">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
              <div
                key={index}
                className={`w-6 h-6 text-center text-sm ${dayOfWeek === index ? "font-bold" : "text-gray-400"}`}
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column - Schedule */}
          <div className="flex-1">
            <div className="mb-4 flex items-center flex-wrap gap-2">
              <h2 className="text-gray-600 uppercase tracking-wide mb-2">TODAY&apos;S SCHEDULE</h2>
              {!isExporting && (
                <div className="ml-auto flex items-center gap-2">
                  <div className="flex items-center">
                    <label className="text-sm text-gray-500 mr-2">View:</label>
                    <select
                      value={viewMode}
                      onChange={(e) => setViewMode(e.target.value as "all" | "custom")}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="all">All Hours</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>

                  {viewMode === "custom" && (
                    <>
                      <div className="flex items-center">
                        <label className="text-sm text-gray-500 mr-2">From:</label>
                        <select
                          value={startHour}
                          onChange={(e) => setStartHour(Number.parseInt(e.target.value))}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>
                              {i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center">
                        <label className="text-sm text-gray-500 mr-2">To:</label>
                        <select
                          value={endHour}
                          onChange={(e) => setEndHour(Number.parseInt(e.target.value))}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>
                              {i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div>
              {timeSlots
                .filter((slot) => viewMode === "all" || (slot.hour >= startHour && slot.hour <= endHour))
                .map((slot, index) => (
                  <div key={index} className="mb-4 flex items-center">
                    <div className="w-16 text-gray-600">{slot.display}</div>
                    <input
                      type="text"
                      value={scheduleItems[slot.hour] || ""}
                      onChange={(e) => updateScheduleItem(slot.hour, e.target.value)}
                      className="flex-1 border-b border-gray-300 px-2 py-1 focus:outline-none focus:border-gray-500"
                      placeholder=""
                      readOnly={isExporting}
                    />
                  </div>
                ))}
            </div>

            <div className="mt-8">
              <h2 className="text-gray-600 uppercase tracking-wide mb-4">I&apos;M GRATEFUL FOR</h2>
              {gratefulItems.map((item, index) => (
                <input
                  key={index}
                  type="text"
                  value={item}
                  onChange={(e) => updateGratefulItem(index, e.target.value)}
                  className="w-full border-b border-gray-300 px-2 py-1 mb-4 focus:outline-none focus:border-gray-500"
                  placeholder=""
                  readOnly={isExporting}
                />
              ))}
            </div>
          </div>

          {/* Right Column - Task Lists */}
          <div className="flex-1">
            <div className="mb-8">
              <h2 className="text-gray-600 uppercase tracking-wide mb-4">MUST DO TODAY</h2>
              {mustDoItems.map((item, index) => (
                <div key={index} className="flex items-center mb-4">
                  <div
                    className={`w-4 h-4 rounded-full border border-gray-400 ${!isExporting ? "cursor-pointer" : ""} ${item.completed ? "bg-gray-400" : "bg-gray-200"}`}
                    onClick={() =>
                      !isExporting && updateTaskList(mustDoItems, setMustDoItems, index, !item.completed, "completed")
                    }
                  ></div>
                  <div className="flex-1 ml-2">
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => updateTaskList(mustDoItems, setMustDoItems, index, e.target.value)}
                        className={`flex-1 border-b border-gray-300 px-2 py-1 focus:outline-none focus:border-gray-500 ${item.completed ? "text-gray-400 line-through" : ""}`}
                        placeholder=""
                        readOnly={isExporting}
                      />
                      {item.text && !isExporting && (
                        <div className="flex items-center ml-2 space-x-2">
                          <select
                            value={timeEstimates[`must-${index}`] || ""}
                            onChange={(e) => addTimeEstimate(`must-${index}`, Number.parseInt(e.target.value) || 0)}
                            className="border border-gray-200 rounded text-xs px-1"
                          >
                            <option value="">Time</option>
                            <option value="15">15m</option>
                            <option value="30">30m</option>
                            <option value="45">45m</option>
                            <option value="60">1h</option>
                            <option value="90">1.5h</option>
                            <option value="120">2h</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => toggleRecurringTask(item.text)}
                            className={`text-xs px-1 py-0.5 rounded ${
                              recurringTasks.includes(item.text)
                                ? "bg-gray-200 text-gray-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {recurringTasks.includes(item.text) ? "↻ Recurring" : "↻"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-8">
              <h2 className="text-gray-600 uppercase tracking-wide mb-4">SECOND PRIORITY</h2>
              {secondPriorityItems.map((item, index) => (
                <div key={index} className="flex items-center mb-4">
                  <div
                    className={`w-4 h-4 rounded-full border border-gray-400 ${!isExporting ? "cursor-pointer" : ""} ${item.completed ? "bg-gray-400" : "bg-gray-200"}`}
                    onClick={() =>
                      !isExporting &&
                      updateTaskList(secondPriorityItems, setSecondPriorityItems, index, !item.completed, "completed")
                    }
                  ></div>
                  <div className="flex-1 ml-2">
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) =>
                          updateTaskList(secondPriorityItems, setSecondPriorityItems, index, e.target.value)
                        }
                        className={`flex-1 border-b border-gray-300 px-2 py-1 focus:outline-none focus:border-gray-500 ${item.completed ? "text-gray-400 line-through" : ""}`}
                        placeholder=""
                        readOnly={isExporting}
                      />
                      {item.text && !isExporting && (
                        <div className="flex items-center ml-2 space-x-2">
                          <select
                            value={timeEstimates[`second-${index}`] || ""}
                            onChange={(e) => addTimeEstimate(`second-${index}`, Number.parseInt(e.target.value) || 0)}
                            className="border border-gray-200 rounded text-xs px-1"
                          >
                            <option value="">Time</option>
                            <option value="15">15m</option>
                            <option value="30">30m</option>
                            <option value="45">45m</option>
                            <option value="60">1h</option>
                            <option value="90">1.5h</option>
                            <option value="120">2h</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => toggleRecurringTask(item.text)}
                            className={`text-xs px-1 py-0.5 rounded ${
                              recurringTasks.includes(item.text)
                                ? "bg-gray-200 text-gray-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {recurringTasks.includes(item.text) ? "↻ Recurring" : "↻"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-8">
              <h2 className="text-gray-600 uppercase tracking-wide mb-4">IF THERE&apos;S EXTRA TIME...</h2>
              {extraTimeItems.map((item, index) => (
                <div key={index} className="flex items-center mb-4">
                  <div
                    className={`w-4 h-4 rounded-full border border-gray-400 ${!isExporting ? "cursor-pointer" : ""} ${item.completed ? "bg-gray-400" : "bg-gray-200"}`}
                    onClick={() =>
                      !isExporting &&
                      updateTaskList(extraTimeItems, setExtraTimeItems, index, !item.completed, "completed")
                    }
                  ></div>
                  <div className="flex-1 ml-2">
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => updateTaskList(extraTimeItems, setExtraTimeItems, index, e.target.value)}
                        className={`flex-1 border-b border-gray-300 px-2 py-1 focus:outline-none focus:border-gray-500 ${item.completed ? "text-gray-400 line-through" : ""}`}
                        placeholder=""
                        readOnly={isExporting}
                      />
                      {item.text && !isExporting && (
                        <div className="flex items-center ml-2 space-x-2">
                          <select
                            value={timeEstimates[`extra-${index}`] || ""}
                            onChange={(e) => addTimeEstimate(`extra-${index}`, Number.parseInt(e.target.value) || 0)}
                            className="border border-gray-200 rounded text-xs px-1"
                          >
                            <option value="">Time</option>
                            <option value="15">15m</option>
                            <option value="30">30m</option>
                            <option value="45">45m</option>
                            <option value="60">1h</option>
                            <option value="90">1.5h</option>
                            <option value="120">2h</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => toggleRecurringTask(item.text)}
                            className={`text-xs px-1 py-0.5 rounded ${
                              recurringTasks.includes(item.text)
                                ? "bg-gray-200 text-gray-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {recurringTasks.includes(item.text) ? "↻ Recurring" : "↻"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-8">
              <h2 className="text-gray-600 uppercase tracking-wide mb-4">SELF CARE</h2>
              {selfCareItems.map((item, index) => (
                <div key={index} className="flex items-center mb-4">
                  <div
                    className={`w-4 h-4 rounded-full border border-gray-400 ${!isExporting ? "cursor-pointer" : ""} ${item.completed ? "bg-gray-400" : "bg-gray-200"}`}
                    onClick={() =>
                      !isExporting &&
                      updateTaskList(selfCareItems, setSelfCareItems, index, !item.completed, "completed")
                    }
                  ></div>
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => updateTaskList(selfCareItems, setSelfCareItems, index, e.target.value)}
                    className="flex-1 border-b border-gray-300 px-2 py-1 ml-2 focus:outline-none focus:border-gray-500"
                    placeholder=""
                    readOnly={isExporting}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Buttons */}
        <div className="flex mt-8 space-x-4 justify-center flex-wrap">
          <button
            className={`px-3 py-1 rounded flex items-center ${taskStatus === "TO START" ? "bg-gray-200" : ""}`}
            onClick={() => !isExporting && setTaskStatus("TO START")}
            disabled={isExporting}
          >
            <div className="w-4 h-4 rounded-full border border-gray-600 mr-1"></div> TO START
          </button>
          <button
            className={`px-3 py-1 rounded flex items-center ${taskStatus === "OK" ? "bg-gray-200" : ""}`}
            onClick={() => !isExporting && setTaskStatus("OK")}
            disabled={isExporting}
          >
            <span className="mr-1">✓</span> OK
          </button>
          <button
            className={`px-3 py-1 rounded flex items-center ${taskStatus === "DELAY" ? "bg-gray-200" : ""}`}
            onClick={() => !isExporting && setTaskStatus("DELAY")}
            disabled={isExporting}
          >
            <span className="mr-1">→</span> DELAY
          </button>
          <button
            className={`px-3 py-1 rounded flex items-center ${taskStatus === "STUCK" ? "bg-gray-200" : ""}`}
            onClick={() => !isExporting && setTaskStatus("STUCK")}
            disabled={isExporting}
          >
            <span className="mr-1">⚠</span> STUCK
          </button>
          <button
            className={`px-3 py-1 rounded flex items-center ${taskStatus === "CANCEL" ? "bg-gray-200" : ""}`}
            onClick={() => !isExporting && setTaskStatus("CANCEL")}
            disabled={isExporting}
          >
            <span className="mr-1">✕</span> CANCEL
          </button>
        </div>
      </div>

      {/* Smart Features - excluded from printable content */}
      {!isExporting && (
        <div className="mt-8 border-t pt-6">
          <h2 className="text-gray-600 uppercase tracking-wide mb-4">SMART FEATURES</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="auto-save"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label
                htmlFor="auto-save"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Auto-save (every 30 seconds)
              </label>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Task Completion Stats</h3>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="font-medium">Must Do: </span>
                {mustDoItems.filter((item) => item.completed).length}/{mustDoItems.filter((item) => item.text).length}
              </div>
              <div>
                <span className="font-medium">Second Priority: </span>
                {secondPriorityItems.filter((item) => item.completed).length}/
                {secondPriorityItems.filter((item) => item.text).length}
              </div>
              <div>
                <span className="font-medium">Extra Time: </span>
                {extraTimeItems.filter((item) => item.completed).length}/
                {extraTimeItems.filter((item) => item.text).length}
              </div>
            </div>
          </div>
        </div>
      )}
      <Toaster />
    </div>
  )
}

