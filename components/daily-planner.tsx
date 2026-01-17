"use client";

import type React from "react";

import { useEffect, useState, useRef, useCallback } from "react";
import { format } from "date-fns";
import { Save, Download, Image, Loader2, CheckCircle2, Clock, AlertTriangle, XCircle, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

interface TaskItem {
  text: string;
  completed: boolean;
}

interface DailyPlannerProps {
  initialDate?: string;
  gistId?: string;
}

interface GistFile {
  filename: string;
  content: string;
}

interface GistData {
  startHour: number;
  endHour: number;
  viewMode: "all" | "custom";
  scheduleItems: Record<string, string>;
  mustDoItems: TaskItem[];
  secondPriorityItems: TaskItem[];
  lessonsOfTheDay: TaskItem[];
  selfCareItems: TaskItem[];
  gratefulItems: string[];
  taskStatus: string;
  timeEstimates: Record<string, number>;
  recurringTasks: string[];
}

const GITHUB_TOKEN = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
const DEFAULT_GIST_ID = process.env.NEXT_PUBLIC_GIST_ID;

export default function DailyPlanner({
  initialDate,
  gistId = DEFAULT_GIST_ID,
}: DailyPlannerProps) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"all" | "custom">("all");
  const [date, setDate] = useState(() => {
    if (initialDate) return initialDate;
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const [startHour, setStartHour] = useState(0);
  const [endHour, setEndHour] = useState(23);
  const [scheduleItems, setScheduleItems] = useState<Record<string, string>>(
    {}
  );
  const [mustDoItems, setMustDoItems] = useState<TaskItem[]>(
    Array(5).fill({ text: "", completed: false })
  );
  const [secondPriorityItems, setSecondPriorityItems] = useState<TaskItem[]>(
    Array(4).fill({ text: "", completed: false })
  );
  const [lessonsOfTheDay, setLessonsOfTheDay] = useState<TaskItem[]>(
    Array(4).fill({ text: "", completed: false })
  );
  const [selfCareItems, setSelfCareItems] = useState<TaskItem[]>(
    Array(3).fill({ text: "", completed: false })
  );
  const [gratefulItems, setGratefulItems] = useState<string[]>(["", "", ""]);
  const [taskStatus, setTaskStatus] = useState("TO START");
  const [timeEstimates, setTimeEstimates] = useState<Record<string, number>>(
    {}
  );
  const [recurringTasks, setRecurringTasks] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportPreview, setShowExportPreview] = useState(false);

  const plannerRef = useRef<HTMLDivElement>(null);
  const printableContentRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Function to get Gist content
  const getGistContent = async () => {
    const token = GITHUB_TOKEN;
    const gistIdToUse = gistId || DEFAULT_GIST_ID;

    if (!token) {
      console.error("GitHub token is missing");
      toast({
        title: "Configuration Error",
        description:
          "GitHub token is missing. Please check your environment variables.",
        variant: "destructive",
      });
      return null;
    }

    if (!gistIdToUse) {
      console.error("Gist ID is missing");
      toast({
        title: "Configuration Error",
        description:
          "Gist ID is missing. Please check your environment variables.",
        variant: "destructive",
      });
      return null;
    }

    try {
      console.log("Fetching Gist data...", { gistIdToUse });
      const response = await fetch(
        `https://api.github.com/gists/${gistIdToUse}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to fetch Gist:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });

        toast({
          title: "Failed to fetch data",
          description: `Error: ${response.status} - ${response.statusText}`,
          variant: "destructive",
        });
        return null;
      }

      const data = await response.json();
      console.log("Gist data fetched successfully:", {
        filesCount: Object.keys(data.files || {}).length,
        files: Object.keys(data.files || {}),
      });
      return data.files;
    } catch (error) {
      console.error("Error fetching Gist:", error);
      toast({
        title: "Error",
        description: "Failed to fetch planner data from Gist.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Function to update Gist
  const updateGist = async (filename: string, content: string) => {
    const token = GITHUB_TOKEN;
    const gistIdToUse = gistId || DEFAULT_GIST_ID;

    if (!token || !gistIdToUse) return false;

    try {
      const response = await fetch(
        `https://api.github.com/gists/${gistIdToUse}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            files: {
              [filename]: {
                content,
              },
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to update Gist:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error updating Gist:", error);
      return false;
    }
  };

  // Load data from Gist when date changes
  useEffect(() => {
    const loadData = async () => {
      console.log("Loading data for date:", date);
      const files = await getGistContent();

      if (!files) {
        console.log("No files found in Gist");
        return;
      }

      const filename = `planner-${date}.json`;
      console.log("Looking for file:", filename);
      const fileData = files[filename];

      if (fileData) {
        console.log("Found data for date:", date);
        try {
          const parsedData: GistData = JSON.parse(fileData.content);
          console.log("Parsed data:", parsedData);

          // Update state with parsed data
          setStartHour(parsedData.startHour ?? 0);
          setEndHour(parsedData.endHour ?? 23);
          setViewMode(parsedData.viewMode || "all");
          setScheduleItems(parsedData.scheduleItems || {});
          setMustDoItems(
            parsedData.mustDoItems ||
              Array(5).fill({ text: "", completed: false })
          );
          setSecondPriorityItems(
            parsedData.secondPriorityItems ||
              Array(4).fill({ text: "", completed: false })
          );
          setLessonsOfTheDay(
            parsedData.lessonsOfTheDay ||
              Array(4).fill({ text: "", completed: false })
          );
          setSelfCareItems(
            parsedData.selfCareItems ||
              Array(3).fill({ text: "", completed: false })
          );
          setGratefulItems(parsedData.gratefulItems || ["", "", ""]);
          setTaskStatus(parsedData.taskStatus || "TO START");
          setTimeEstimates(parsedData.timeEstimates || {});
          setRecurringTasks(parsedData.recurringTasks || []);

          toast({
            title: "Data loaded",
            description: `Loaded planner data for ${format(
              new Date(date),
              "MMMM d, yyyy"
            )}`,
          });
        } catch (error) {
          console.error("Error parsing Gist data:", error);
          toast({
            title: "Error",
            description: "Failed to parse planner data.",
            variant: "destructive",
          });
        }
      } else {
        console.log("No data found for date:", date);
        // Reset form if no data exists for this date
        setStartHour(0);
        setEndHour(23);
        setViewMode("all");
        setScheduleItems({});
        setMustDoItems(Array(5).fill({ text: "", completed: false }));
        setSecondPriorityItems(Array(4).fill({ text: "", completed: false }));
        setLessonsOfTheDay(Array(4).fill({ text: "", completed: false }));
        setSelfCareItems(Array(3).fill({ text: "", completed: false }));
        setGratefulItems(["", "", ""]);
        setTaskStatus("TO START");
        setTimeEstimates({});
        setRecurringTasks([]);

        toast({
          title: "New day",
          description: `Started new planner for ${format(
            new Date(date),
            "MMMM d, yyyy"
          )}`,
        });
      }
    };

    loadData();
  }, [date, gistId]);

  // Auto-save to Gist
  useEffect(() => {
    let saveTimer: NodeJS.Timeout | null = null;

    if (gistId) {
      saveTimer = setTimeout(async () => {
        const dataToSave: GistData = {
          startHour,
          endHour,
          viewMode,
          scheduleItems,
          mustDoItems,
          secondPriorityItems,
          lessonsOfTheDay,
          selfCareItems,
          gratefulItems,
          taskStatus,
          timeEstimates,
          recurringTasks,
        };

        const filename = `planner-${date}.json`;
        const success = await updateGist(
          filename,
          JSON.stringify(dataToSave, null, 2)
        );

        if (success) {
          toast({
            title: "Auto-saved",
            description: `Your planner for ${format(
              new Date(date),
              "MMMM d, yyyy"
            )} has been auto-saved.`,
            duration: 2000,
          });
        }
      }, 30000); // Auto-save after 30 seconds of inactivity
    }

    return () => {
      if (saveTimer) clearTimeout(saveTimer);
    };
  }, [
    gistId,
    date,
    startHour,
    endHour,
    viewMode,
    scheduleItems,
    mustDoItems,
    secondPriorityItems,
    lessonsOfTheDay,
    selfCareItems,
    gratefulItems,
    taskStatus,
    timeEstimates,
    recurringTasks,
  ]);

  // Save to Gist
  const saveToGist = async () => {
    if (!gistId) {
      toast({
        title: "Missing Configuration",
        description: "No Gist ID provided for saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    const dataToSave: GistData = {
      startHour,
      endHour,
      viewMode,
      scheduleItems,
      mustDoItems,
      secondPriorityItems,
      lessonsOfTheDay,
      selfCareItems,
      gratefulItems,
      taskStatus,
      timeEstimates,
      recurringTasks,
    };

    const filename = `planner-${date}.json`;
    const success = await updateGist(
      filename,
      JSON.stringify(dataToSave, null, 2)
    );

    if (success) {
      toast({
        title: "Changes Saved",
        description: `Your planner for ${format(
          new Date(date),
          "MMMM d, yyyy"
        )} has been updated.`,
        variant: "default",
        duration: 3000,
      });
    } else {
      toast({
        title: "Save Failed",
        description:
          "Could not save changes. Please verify your Gist ID and token.",
        variant: "destructive",
        duration: 4000,
      });
    }
    setIsSaving(false);
  };

  // Export to Image function
  const exportToImage = useCallback(async () => {
    if (!exportRef.current) return;

    setIsExporting(true);
    setShowExportPreview(true);

    // Wait for the preview to render
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const canvas = await html2canvas(exportRef.current, {
        scale: 2, // Higher resolution
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        windowWidth: 800,
        windowHeight: exportRef.current.scrollHeight,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `daily-planner-${date}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast({
            title: "Export Successful",
            description: "Your daily planner has been saved as an image.",
            duration: 3000,
          });
        }
      }, "image/png", 1.0);
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export Failed",
        description: "Could not export the planner. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setShowExportPreview(false);
    }
  }, [date, toast]);

  // Replace the generateTimeSlots function with this updated version that shows all 24 hours
  const generateTimeSlots = () => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
      const hour = (startHour + i) % 24;
      const formattedHour =
        hour === 0
          ? "12am"
          : hour === 12
          ? "12pm"
          : hour < 12
          ? `${hour}am`
          : `${hour - 12}pm`;
      slots.push({ hour, display: formattedHour });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Get filtered time slots for display
  const getDisplayedTimeSlots = () => {
    return timeSlots.filter(
      (slot) =>
        viewMode === "all" ||
        (slot.hour >= startHour && slot.hour <= endHour)
    );
  };

  // Update items in the various lists
  const updateTaskList = (
    list: any[],
    setList: React.Dispatch<React.SetStateAction<any[]>>,
    index: number,
    value: any,
    field = "text"
  ) => {
    const newList = [...list];
    if (field === "completed") {
      newList[index] = { ...newList[index], completed: value };
    } else {
      newList[index] = { ...newList[index], text: value };
    }
    setList(newList);
  };

  // Handle schedule item updates
  const updateScheduleItem = (hour: number, value: string) => {
    setScheduleItems({ ...scheduleItems, [hour]: value });
  };

  // Handle grateful items
  const updateGratefulItem = (index: number, value: string) => {
    const newList = [...gratefulItems];
    newList[index] = value;
    setGratefulItems(newList);
  };

  // Add these helper functions after the other helper functions
  const addTimeEstimate = (taskId: string, minutes: number) => {
    setTimeEstimates((prev) => ({
      ...prev,
      [taskId]: minutes,
    }));
  };

  const toggleRecurringTask = (taskText: string) => {
    setRecurringTasks((prev) => {
      if (prev.includes(taskText)) {
        return prev.filter((t) => t !== taskText);
      } else {
        return [...prev, taskText];
      }
    });
  };

  const copyTasksFromPreviousDay = () => {
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const savedData = localStorage.getItem(`planner-${yesterdayStr}`);
    if (savedData) {
      const parsedData = JSON.parse(savedData);

      // Only copy incomplete tasks
      const incompleteMustDo = (parsedData.mustDoItems || [])
        .filter((item: TaskItem) => !item.completed)
        .map((item: TaskItem) => ({ ...item, completed: false }));

      const incompleteSecondPriority = (parsedData.secondPriorityItems || [])
        .filter((item: TaskItem) => !item.completed)
        .map((item: TaskItem) => ({ ...item, completed: false }));

      const incompleteLessons = (parsedData.lessonsOfTheDay || [])
        .filter((item: TaskItem) => !item.completed)
        .map((item: TaskItem) => ({ ...item, completed: false }));

      setMustDoItems((prev) => {
        // Replace empty slots with incomplete tasks
        const newItems = [...prev];
        let incompleteIndex = 0;
        for (
          let i = 0;
          i < newItems.length && incompleteIndex < incompleteMustDo.length;
          i++
        ) {
          if (!newItems[i].text) {
            newItems[i] = incompleteMustDo[incompleteIndex];
            incompleteIndex++;
          }
        }
        return newItems;
      });

      setSecondPriorityItems((prev) => {
        const newItems = [...prev];
        let incompleteIndex = 0;
        for (
          let i = 0;
          i < newItems.length &&
          incompleteIndex < incompleteSecondPriority.length;
          i++
        ) {
          if (!newItems[i].text) {
            newItems[i] = incompleteSecondPriority[incompleteIndex];
            incompleteIndex++;
          }
        }
        return newItems;
      });

      setLessonsOfTheDay((prev) => {
        const newItems = [...prev];
        let incompleteIndex = 0;
        for (
          let i = 0;
          i < newItems.length && incompleteIndex < incompleteLessons.length;
          i++
        ) {
          if (!newItems[i].text) {
            newItems[i] = incompleteLessons[incompleteIndex];
            incompleteIndex++;
          }
        }
        return newItems;
      });

      toast({
        title: "Tasks imported",
        description:
          "Incomplete tasks from yesterday have been added to your planner.",
      });
    } else {
      toast({
        title: "No previous data",
        description: "No planner data found for yesterday.",
        variant: "destructive",
      });
    }
  };

  const dayOfWeek = date ? new Date(date).getDay() : null;
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Calculate completion stats
  const getCompletionStats = () => {
    const mustDoTotal = mustDoItems.filter((item) => item.text).length;
    const mustDoCompleted = mustDoItems.filter((item) => item.completed && item.text).length;
    const secondTotal = secondPriorityItems.filter((item) => item.text).length;
    const secondCompleted = secondPriorityItems.filter((item) => item.completed && item.text).length;
    const extraTotal = lessonsOfTheDay.filter((item) => item.text).length;
    const extraCompleted = lessonsOfTheDay.filter((item) => item.completed && item.text).length;
    const selfCareTotal = selfCareItems.filter((item) => item.text).length;
    const selfCareCompleted = selfCareItems.filter((item) => item.completed && item.text).length;

    const total = mustDoTotal + secondTotal + extraTotal + selfCareTotal;
    const completed = mustDoCompleted + secondCompleted + extraCompleted + selfCareCompleted;

    return {
      mustDo: { total: mustDoTotal, completed: mustDoCompleted },
      second: { total: secondTotal, completed: secondCompleted },
      extra: { total: extraTotal, completed: extraCompleted },
      selfCare: { total: selfCareTotal, completed: selfCareCompleted },
      overall: { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 },
    };
  };

  const stats = getCompletionStats();

  // Render task item with checkbox
  const renderTaskItem = (
    item: TaskItem,
    index: number,
    list: TaskItem[],
    setList: React.Dispatch<React.SetStateAction<TaskItem[]>>,
    prefix: string,
    showExtras: boolean = true
  ) => (
    <div key={index} className="group flex items-start gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50/80 transition-all duration-200">
      <button
        type="button"
        onClick={() => updateTaskList(list, setList, index, !item.completed, "completed")}
        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
          item.completed
            ? "bg-gradient-to-br from-emerald-400 to-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200"
            : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50"
        }`}
      >
        {item.completed && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <input
          type="text"
          value={item.text}
          onChange={(e) => updateTaskList(list, setList, index, e.target.value)}
          className={`w-full bg-transparent border-0 border-b border-transparent focus:border-gray-300 px-0 py-0.5 text-[15px] focus:outline-none focus:ring-0 transition-all duration-200 placeholder:text-gray-300 ${
            item.completed ? "text-gray-400 line-through" : "text-gray-700"
          }`}
          placeholder="Add a task..."
        />
        {showExtras && item.text && (
          <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <select
              value={timeEstimates[`${prefix}-${index}`] || ""}
              onChange={(e) =>
                addTimeEstimate(`${prefix}-${index}`, Number.parseInt(e.target.value) || 0)
              }
              className="text-xs bg-gray-100 hover:bg-gray-200 rounded-lg px-2 py-1 border-0 text-gray-600 cursor-pointer transition-colors"
            >
              <option value="">Est. time</option>
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hrs</option>
              <option value="120">2 hours</option>
            </select>
            <button
              type="button"
              onClick={() => toggleRecurringTask(item.text)}
              className={`text-xs px-2 py-1 rounded-lg transition-all duration-200 ${
                recurringTasks.includes(item.text)
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {recurringTasks.includes(item.text) ? "Recurring" : "Make recurring"}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Render printable task for export
  const renderPrintableTask = (item: TaskItem, index: number) => {
    if (!item.text) return null;
    return (
      <div key={index} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
          item.completed ? "bg-emerald-500 border-emerald-500" : "border-gray-300"
        }`}>
          {item.completed && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className={`text-sm ${item.completed ? "text-gray-400 line-through" : "text-gray-700"}`}>
          {item.text}
        </span>
      </div>
    );
  };

  return (
    <>
      {/* Main Planner UI */}
      <div
        ref={plannerRef}
        className="max-w-5xl mx-auto p-4 sm:p-8 bg-gradient-to-br from-white via-gray-50/30 to-white min-h-screen"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-light text-gray-800 tracking-tight">
                Daily Planner
              </h1>
              <p className="text-gray-500 mt-1">Organize your day, achieve your goals</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={saveToGist}
                className="bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white shadow-lg shadow-gray-300/50 transition-all duration-300 hover:shadow-xl hover:shadow-gray-400/50"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
              <Button
                onClick={exportToImage}
                variant="outline"
                className="border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300"
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Image className="h-4 w-4 mr-2" />
                    Export Image
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Date and Day Selection */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex gap-1 sm:ml-auto">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                <div
                  key={index}
                  className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-300 ${
                    dayOfWeek === index
                      ? "bg-gradient-to-br from-gray-800 to-gray-900 text-white shadow-lg"
                      : "text-gray-400 hover:bg-gray-100"
                  }`}
                  title={dayNames[index]}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          {stats.overall.total > 0 && (
            <div className="mt-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Today&apos;s Progress</span>
                <span className="text-sm font-bold text-gray-800">{stats.overall.percentage}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${stats.overall.percentage}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
                <span>Must Do: {stats.mustDo.completed}/{stats.mustDo.total}</span>
                <span>Priority: {stats.second.completed}/{stats.second.total}</span>
                <span>Extra: {stats.extra.completed}/{stats.extra.total}</span>
                <span>Self Care: {stats.selfCare.completed}/{stats.selfCare.total}</span>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Schedule */}
          <div className="space-y-6">
            {/* Today's Schedule */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-500" />
                    Today&apos;s Schedule
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={viewMode}
                      onChange={(e) => setViewMode(e.target.value as "all" | "custom")}
                      className="text-sm bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1.5 border-0 text-gray-600 cursor-pointer transition-colors"
                    >
                      <option value="all">All Hours</option>
                      <option value="custom">Custom Range</option>
                    </select>
                    {viewMode === "custom" && (
                      <div className="flex items-center gap-2">
                        <select
                          value={startHour}
                          onChange={(e) => setStartHour(Number.parseInt(e.target.value))}
                          className="text-sm bg-gray-100 hover:bg-gray-200 rounded-lg px-2 py-1.5 border-0 text-gray-600 cursor-pointer transition-colors"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>
                              {i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`}
                            </option>
                          ))}
                        </select>
                        <span className="text-gray-400">to</span>
                        <select
                          value={endHour}
                          onChange={(e) => setEndHour(Number.parseInt(e.target.value))}
                          className="text-sm bg-gray-100 hover:bg-gray-200 rounded-lg px-2 py-1.5 border-0 text-gray-600 cursor-pointer transition-colors"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>
                              {i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-4 max-h-[500px] overflow-y-auto">
                <div className="space-y-1">
                  {getDisplayedTimeSlots().map((slot, index) => (
                    <div key={index} className="group flex items-center gap-3 py-2 hover:bg-gray-50 rounded-lg px-2 transition-colors">
                      <div className="w-14 text-sm font-medium text-gray-400 group-hover:text-gray-600 transition-colors">
                        {slot.display}
                      </div>
                      <input
                        type="text"
                        value={scheduleItems[slot.hour] || ""}
                        onChange={(e) => updateScheduleItem(slot.hour, e.target.value)}
                        className="flex-1 bg-transparent border-0 border-b border-gray-100 focus:border-gray-300 px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-0 transition-all placeholder:text-gray-300"
                        placeholder="What's happening?"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Grateful For */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
                <h2 className="text-lg font-semibold text-gray-800">I&apos;m Grateful For</h2>
              </div>
              <div className="p-4 space-y-3">
                {gratefulItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-sm font-medium">
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateGratefulItem(index, e.target.value)}
                      className="flex-1 bg-transparent border-0 border-b border-gray-100 focus:border-amber-300 px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-0 transition-all placeholder:text-gray-300"
                      placeholder="What are you grateful for?"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Tasks */}
          <div className="space-y-6">
            {/* Must Do Today */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    Must Do Today
                  </h2>
                  {stats.mustDo.total > 0 && (
                    <span className="text-sm text-gray-500">
                      {stats.mustDo.completed}/{stats.mustDo.total}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-2">
                {mustDoItems.map((item, index) =>
                  renderTaskItem(item, index, mustDoItems, setMustDoItems, "must")
                )}
              </div>
            </div>

            {/* Second Priority */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    Second Priority
                  </h2>
                  {stats.second.total > 0 && (
                    <span className="text-sm text-gray-500">
                      {stats.second.completed}/{stats.second.total}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-2">
                {secondPriorityItems.map((item, index) =>
                  renderTaskItem(item, index, secondPriorityItems, setSecondPriorityItems, "second")
                )}
              </div>
            </div>

            {/* If There's Extra Time */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    If There&apos;s Extra Time
                  </h2>
                  {stats.extra.total > 0 && (
                    <span className="text-sm text-gray-500">
                      {stats.extra.completed}/{stats.extra.total}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-2">
                {lessonsOfTheDay.map((item, index) =>
                  renderTaskItem(item, index, lessonsOfTheDay, setLessonsOfTheDay, "extra")
                )}
              </div>
            </div>

            {/* Self Care */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    Self Care
                  </h2>
                  {stats.selfCare.total > 0 && (
                    <span className="text-sm text-gray-500">
                      {stats.selfCare.completed}/{stats.selfCare.total}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-2">
                {selfCareItems.map((item, index) =>
                  renderTaskItem(item, index, selfCareItems, setSelfCareItems, "selfcare", false)
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Buttons */}
        <div className="mt-8 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4 text-center sm:text-left">Day Status</h3>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 justify-center">
            <button
              className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-300 font-medium text-sm sm:text-base ${
                taskStatus === "TO START"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200"
                  : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
              }`}
              onClick={() => setTaskStatus("TO START")}
            >
              <Circle className="w-4 h-4" />
              <span className="hidden xs:inline">To Start</span>
              <span className="xs:hidden">Start</span>
            </button>
            <button
              className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-300 font-medium text-sm sm:text-base ${
                taskStatus === "OK"
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200"
                  : "bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600"
              }`}
              onClick={() => setTaskStatus("OK")}
            >
              <CheckCircle2 className="w-4 h-4" />
              Done
            </button>
            <button
              className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-300 font-medium text-sm sm:text-base ${
                taskStatus === "DELAY"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-200"
                  : "bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-600"
              }`}
              onClick={() => setTaskStatus("DELAY")}
            >
              <Clock className="w-4 h-4" />
              Delay
            </button>
            <button
              className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-300 font-medium text-sm sm:text-base ${
                taskStatus === "STUCK"
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200"
                  : "bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600"
              }`}
              onClick={() => setTaskStatus("STUCK")}
            >
              <AlertTriangle className="w-4 h-4" />
              Stuck
            </button>
            <button
              className={`col-span-2 sm:col-span-1 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-300 font-medium text-sm sm:text-base ${
                taskStatus === "CANCEL"
                  ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-200"
                  : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"
              }`}
              onClick={() => setTaskStatus("CANCEL")}
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>

        {/* Smart Features Section */}
        <div className="mt-6 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Quick Actions</h3>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={copyTasksFromPreviousDay}
              className="text-sm w-full sm:w-auto justify-center"
            >
              Import Yesterday&apos;s Tasks
            </Button>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg justify-center sm:justify-start">
              <input
                type="checkbox"
                id="auto-save"
                checked={!!gistId}
                onChange={(e) => {
                  if (e.target.checked) {
                    saveToGist();
                  }
                }}
                className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
              />
              <label htmlFor="auto-save" className="text-sm text-gray-600">
                Auto-save enabled (every 30s)
              </label>
            </div>
          </div>
        </div>

        <Toaster />
      </div>

      {/* Export Preview - Hidden but rendered for html2canvas */}
      {showExportPreview && (
        <div className="fixed left-[-9999px] top-0">
          <div
            ref={exportRef}
            className="w-[800px] bg-white p-8"
            style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
          >
            {/* Export Header */}
            <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Daily Planner</h1>
              <p className="text-lg text-gray-600">
                {format(new Date(date), "EEEE, MMMM d, yyyy")}
              </p>
              {stats.overall.total > 0 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="h-3 w-48 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${stats.overall.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {stats.overall.percentage}% Complete
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Schedule - Only show hours with content */}
                {Object.keys(scheduleItems).filter(key => scheduleItems[Number(key)]).length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-500" />
                      Today&apos;s Schedule
                    </h2>
                    <div className="space-y-2">
                      {getDisplayedTimeSlots()
                        .filter(slot => scheduleItems[slot.hour])
                        .map((slot, index) => (
                          <div key={index} className="flex items-start gap-3 py-1.5">
                            <span className="w-14 text-sm font-medium text-gray-500">{slot.display}</span>
                            <span className="text-sm text-gray-700 flex-1">{scheduleItems[slot.hour]}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Grateful For */}
                {gratefulItems.filter(item => item).length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                      I&apos;m Grateful For
                    </h2>
                    <div className="space-y-2">
                      {gratefulItems.filter(item => item).map((item, index) => (
                        <div key={index} className="flex items-center gap-2 py-1">
                          <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xs font-medium">
                            {index + 1}
                          </div>
                          <span className="text-sm text-gray-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Must Do Today */}
                {mustDoItems.filter(item => item.text).length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      Must Do Today
                      <span className="ml-auto text-sm font-normal text-gray-500">
                        {stats.mustDo.completed}/{stats.mustDo.total}
                      </span>
                    </h2>
                    <div className="space-y-0.5">
                      {mustDoItems.map((item, index) => renderPrintableTask(item, index))}
                    </div>
                  </div>
                )}

                {/* Second Priority */}
                {secondPriorityItems.filter(item => item.text).length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      Second Priority
                      <span className="ml-auto text-sm font-normal text-gray-500">
                        {stats.second.completed}/{stats.second.total}
                      </span>
                    </h2>
                    <div className="space-y-0.5">
                      {secondPriorityItems.map((item, index) => renderPrintableTask(item, index))}
                    </div>
                  </div>
                )}

                {/* Extra Time */}
                {lessonsOfTheDay.filter(item => item.text).length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      If There&apos;s Extra Time
                      <span className="ml-auto text-sm font-normal text-gray-500">
                        {stats.extra.completed}/{stats.extra.total}
                      </span>
                    </h2>
                    <div className="space-y-0.5">
                      {lessonsOfTheDay.map((item, index) => renderPrintableTask(item, index))}
                    </div>
                  </div>
                )}

                {/* Self Care */}
                {selfCareItems.filter(item => item.text).length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      Self Care
                      <span className="ml-auto text-sm font-normal text-gray-500">
                        {stats.selfCare.completed}/{stats.selfCare.total}
                      </span>
                    </h2>
                    <div className="space-y-0.5">
                      {selfCareItems.map((item, index) => renderPrintableTask(item, index))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status Footer */}
            <div className="mt-8 pt-6 border-t-2 border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Day Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  taskStatus === "OK" ? "bg-emerald-100 text-emerald-700" :
                  taskStatus === "DELAY" ? "bg-amber-100 text-amber-700" :
                  taskStatus === "STUCK" ? "bg-orange-100 text-orange-700" :
                  taskStatus === "CANCEL" ? "bg-red-100 text-red-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {taskStatus === "OK" ? "Completed" :
                   taskStatus === "TO START" ? "To Start" :
                   taskStatus.charAt(0) + taskStatus.slice(1).toLowerCase()}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                Generated with Daily Planner
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
