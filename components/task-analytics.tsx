"use client";

import { useState, useEffect } from "react";
import { format, subDays, isToday, startOfDay } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  ArrowUp,
  ArrowDown,
  Minus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface TaskItem {
  completed: boolean;
  text: string;
}

interface PlannerData {
  mustDoItems?: TaskItem[];
  secondPriorityItems?: TaskItem[];
  extraTimeItems?: TaskItem[];
  timeEstimates?: Record<string, string>;
}

export default function ProgressReport() {
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<"7days" | "30days">("7days");
  const [summary, setSummary] = useState({
    totalTasksCompleted: 0,
    averageCompletionRate: 0,
    totalTimeSpent: 0,
    trend: "neutral",
    mostProductiveDay: "",
    leastProductiveDay: "",
  });

  useEffect(() => {
    // Calculate the date range
    const endDate = new Date();
    const startDate = subDays(endDate, timeRange === "7days" ? 7 : 30);

    // Collect data from localStorage
    const data = [];
    const currentDate = new Date(startDate);
    let totalCompletionRate = 0;
    let totalDays = 0;
    let maxCompletionRate = 0;
    let minCompletionRate = 100;
    let mostProductiveDate = "";
    let leastProductiveDate = "";
    let totalCompleted = 0;
    let totalTimeEstimate = 0;

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const savedData = localStorage.getItem(`planner-${dateStr}`);

      let completedTasks = 0;
      let totalTasks = 0;
      let dayTimeEstimate = 0;

      if (savedData) {
        const parsedData = JSON.parse(savedData) as PlannerData;
        const categories = [
          "mustDoItems",
          "secondPriorityItems",
          "extraTimeItems",
        ] as const;

        categories.forEach((category) => {
          if (parsedData[category]) {
            completedTasks += parsedData[category]!.filter(
              (item) => item.completed && item.text
            ).length;
            totalTasks += parsedData[category]!.filter(
              (item) => item.text
            ).length;
          }
        });

        if (parsedData.timeEstimates) {
          dayTimeEstimate = Object.values(parsedData.timeEstimates).reduce(
            (sum: number, val: any) => sum + (Number.parseInt(val) || 0),
            0
          );
        }
      }

      const completionRate =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      if (completionRate > maxCompletionRate) {
        maxCompletionRate = completionRate;
        mostProductiveDate = dateStr;
      }
      if (completionRate < minCompletionRate && totalTasks > 0) {
        minCompletionRate = completionRate;
        leastProductiveDate = dateStr;
      }

      totalCompleted += completedTasks;
      totalCompletionRate += completionRate;
      totalTimeEstimate += dayTimeEstimate;
      totalDays++;

      data.push({
        date: format(currentDate, "MMM dd"),
        fullDate: dateStr,
        completedTasks,
        totalTasks,
        completionRate,
        timeEstimate: Math.round((dayTimeEstimate / 60) * 10) / 10, // Convert to hours
        isToday: isToday(startOfDay(currentDate)),
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate trend (comparing first half with second half)
    const halfIndex = Math.floor(data.length / 2);
    const firstHalfAvg =
      data
        .slice(0, halfIndex)
        .reduce((sum, day) => sum + day.completionRate, 0) / halfIndex;
    const secondHalfAvg =
      data.slice(halfIndex).reduce((sum, day) => sum + day.completionRate, 0) /
      (data.length - halfIndex);
    const trend =
      secondHalfAvg > firstHalfAvg
        ? "improving"
        : secondHalfAvg < firstHalfAvg
        ? "declining"
        : "neutral";

    setAnalyticsData(data);
    setSummary({
      totalTasksCompleted: totalCompleted,
      averageCompletionRate: Math.round(totalCompletionRate / totalDays),
      totalTimeSpent: Math.round((totalTimeEstimate / 60) * 10) / 10,
      trend,
      mostProductiveDay: mostProductiveDate,
      leastProductiveDay: leastProductiveDate,
    });
  }, [timeRange]);

  const getTrendIcon = () => {
    switch (summary.trend) {
      case "improving":
        return <ArrowUp className="text-green-500" />;
      case "declining":
        return <ArrowDown className="text-red-500" />;
      default:
        return <Minus className="text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Progress Report</CardTitle>
              <CardDescription>
                Task completion and productivity analysis
              </CardDescription>
            </div>
            <Tabs
              defaultValue="7days"
              value={timeRange}
              onValueChange={(v) => setTimeRange(v as any)}
            >
              <TabsList>
                <TabsTrigger value="7days">7 Days</TabsTrigger>
                <TabsTrigger value="30days">30 Days</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Completion Rate
                    </p>
                    <h3 className="text-2xl font-bold">
                      {summary.averageCompletionRate}%
                    </h3>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    {getTrendIcon()}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Tasks Completed
                    </p>
                    <h3 className="text-2xl font-bold">
                      {summary.totalTasksCompleted}
                    </h3>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <CheckCircle2 className="text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Time Invested
                    </p>
                    <h3 className="text-2xl font-bold">
                      {summary.totalTimeSpent}h
                    </h3>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Clock className="text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Trend
                    </p>
                    <h3 className="text-2xl font-bold capitalize">
                      {summary.trend}
                    </h3>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <AlertCircle className="text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="progress">
            <TabsList className="mb-4">
              <TabsTrigger value="progress">Progress Trend</TabsTrigger>
              <TabsTrigger value="tasks">Task Distribution</TabsTrigger>
              <TabsTrigger value="time">Time Investment</TabsTrigger>
            </TabsList>

            <TabsContent value="progress">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis unit="%" domain={[0, 100]} />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Completion Rate"]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="completionRate"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={({ isToday }) => isToday}
                    />
                  </LineChart>
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
                    <Bar
                      dataKey="totalTasks"
                      fill="#82ca9d"
                      name="Total Tasks"
                    />
                    <Bar
                      dataKey="completedTasks"
                      fill="#8884d8"
                      name="Completed Tasks"
                    />
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
                      formatter={(value) => [
                        `${value} hours`,
                        "Time Investment",
                      ]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Bar
                      dataKey="timeEstimate"
                      fill="#ffc658"
                      name="Time Investment"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Most Productive Day
                </h4>
                <p className="text-lg font-semibold">
                  {summary.mostProductiveDay
                    ? format(
                        new Date(summary.mostProductiveDay),
                        "MMMM d, yyyy"
                      )
                    : "No data available"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Areas for Improvement
                </h4>
                <p className="text-lg font-semibold">
                  {summary.leastProductiveDay
                    ? format(
                        new Date(summary.leastProductiveDay),
                        "MMMM d, yyyy"
                      )
                    : "No data available"}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
