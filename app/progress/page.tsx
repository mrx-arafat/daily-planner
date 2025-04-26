"use client";

import { Card } from "@/components/ui/card";

export default function ProgressPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-2xl font-bold">Progress Overview</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-4 text-xl font-semibold">Daily Progress</h2>
          {/* Daily progress visualization will go here */}
        </Card>
        <Card className="p-4">
          <h2 className="mb-4 text-xl font-semibold">Weekly Summary</h2>
          {/* Weekly summary visualization will go here */}
        </Card>
      </div>
    </div>
  );
}
