"use client";

import { useState } from "react";
import { Download, Save } from "lucide-react";

interface DailyPlannerProps {
  initialDate?: string;
}

export default function DailyPlanner({ initialDate }: DailyPlannerProps) {
  const [date, setDate] = useState(
    initialDate || new Date().toISOString().split("T")[0]
  );
  const [viewMode, setViewMode] = useState<"all" | "custom">("all");
  const [scheduleItems, setScheduleItems] = useState<Record<string, string>>(
    {}
  );
  const [mustDoItems, setMustDoItems] = useState(
    Array(5).fill({ text: "", completed: false })
  );
  const [secondPriorityItems, setSecondPriorityItems] = useState(
    Array(4).fill({ text: "", completed: false })
  );
  const [extraTimeItems, setExtraTimeItems] = useState(
    Array(4).fill({ text: "", completed: false })
  );
  const [selfCareItems, setSelfCareItems] = useState(
    Array(3).fill({ text: "", completed: false })
  );
  const [gratefulItems, setGratefulItems] = useState(["", "", ""]);
  const [taskStatus, setTaskStatus] = useState("TO START");

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const ampm = hour >= 12 ? "pm" : "am";
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}${ampm}`;
  });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">DAILY PERSONAL PLANNER</h1>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 border px-3 py-1 rounded hover:bg-gray-50">
              <Download className="h-4 w-4" />
              Export
            </button>
            <button className="flex items-center gap-1 border px-3 py-1 rounded hover:bg-gray-50">
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <span className="font-medium">DATE:</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border px-2 py-1 rounded"
          />
        </div>

        <div className="grid grid-cols-[1fr,1.5fr] gap-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium">TODAY'S SCHEDULE</h2>
              <select
                value={viewMode}
                onChange={(e) =>
                  setViewMode(e.target.value as "all" | "custom")
                }
                className="border px-2 py-1 rounded"
              >
                <option value="all">All Hours</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="space-y-2">
              {timeSlots.map((time) => (
                <div key={time} className="flex items-center gap-2">
                  <span className="w-12 text-gray-600">{time}</span>
                  <input
                    type="text"
                    className="w-full border px-2 py-1 rounded"
                    value={scheduleItems[time] || ""}
                    onChange={(e) =>
                      setScheduleItems({
                        ...scheduleItems,
                        [time]: e.target.value,
                      })
                    }
                    placeholder="Add task..."
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="font-medium mb-4">MUST DO TODAY</h2>
              {mustDoItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={(e) => {
                      const newItems = [...mustDoItems];
                      newItems[index] = {
                        ...item,
                        completed: e.target.checked,
                      };
                      setMustDoItems(newItems);
                    }}
                    className="rounded border-gray-300"
                  />
                  <input
                    type="text"
                    className="w-full border px-2 py-1 rounded"
                    value={item.text}
                    onChange={(e) => {
                      const newItems = [...mustDoItems];
                      newItems[index] = { ...item, text: e.target.value };
                      setMustDoItems(newItems);
                    }}
                    placeholder="Add task..."
                  />
                </div>
              ))}
            </div>

            <div>
              <h2 className="font-medium mb-4">SECOND PRIORITY</h2>
              {secondPriorityItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={(e) => {
                      const newItems = [...secondPriorityItems];
                      newItems[index] = {
                        ...item,
                        completed: e.target.checked,
                      };
                      setSecondPriorityItems(newItems);
                    }}
                    className="rounded border-gray-300"
                  />
                  <input
                    type="text"
                    className="w-full border px-2 py-1 rounded"
                    value={item.text}
                    onChange={(e) => {
                      const newItems = [...secondPriorityItems];
                      newItems[index] = { ...item, text: e.target.value };
                      setSecondPriorityItems(newItems);
                    }}
                    placeholder="Add task..."
                  />
                </div>
              ))}
            </div>

            <div>
              <h2 className="font-medium mb-4">IF THERE'S EXTRA TIME...</h2>
              {extraTimeItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={(e) => {
                      const newItems = [...extraTimeItems];
                      newItems[index] = {
                        ...item,
                        completed: e.target.checked,
                      };
                      setExtraTimeItems(newItems);
                    }}
                    className="rounded border-gray-300"
                  />
                  <input
                    type="text"
                    className="w-full border px-2 py-1 rounded"
                    value={item.text}
                    onChange={(e) => {
                      const newItems = [...extraTimeItems];
                      newItems[index] = { ...item, text: e.target.value };
                      setExtraTimeItems(newItems);
                    }}
                    placeholder="Add task..."
                  />
                </div>
              ))}
            </div>

            <div>
              <h2 className="font-medium mb-4">SELF CARE</h2>
              {selfCareItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={(e) => {
                      const newItems = [...selfCareItems];
                      newItems[index] = {
                        ...item,
                        completed: e.target.checked,
                      };
                      setSelfCareItems(newItems);
                    }}
                    className="rounded border-gray-300"
                  />
                  <input
                    type="text"
                    className="w-full border px-2 py-1 rounded"
                    value={item.text}
                    onChange={(e) => {
                      const newItems = [...selfCareItems];
                      newItems[index] = { ...item, text: e.target.value };
                      setSelfCareItems(newItems);
                    }}
                    placeholder="Add task..."
                  />
                </div>
              ))}
            </div>

            <div>
              <h2 className="font-medium mb-4">I'M GRATEFUL FOR</h2>
              {gratefulItems.map((item, index) => (
                <input
                  key={index}
                  type="text"
                  className="w-full border px-2 py-1 rounded mb-2"
                  value={item}
                  onChange={(e) => {
                    const newItems = [...gratefulItems];
                    newItems[index] = e.target.value;
                    setGratefulItems(newItems);
                  }}
                  placeholder="Add something you're grateful for..."
                />
              ))}
            </div>

            <div className="flex items-center justify-center gap-2">
              {["TO START", "OK", "DELAY", "STUCK", "CANCEL"].map((status) => (
                <button
                  key={status}
                  onClick={() => setTaskStatus(status)}
                  className={`px-3 py-1 rounded ${
                    taskStatus === status
                      ? "bg-gray-200"
                      : "border hover:bg-gray-50"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
