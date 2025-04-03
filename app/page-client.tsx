"use client";

import DailyPlanner from "@/components/daily-planner";

export default function HomeClient() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <DailyPlanner />
      </div>
    </div>
  );
}
