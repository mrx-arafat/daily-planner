"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DailyPlanner from "@/components/daily-planner";
import { PasswordProtection } from "@/components/password-protection";
import { Toaster } from "@/components/ui/toaster";

export default function HomeClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const date = searchParams.get("date");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // If a date is provided in the URL, load that date's planner
  useEffect(() => {
    if (date) {
      // The date will be used by the DailyPlanner component
      // We don't need to do anything here
    }
  }, [date]);

  useEffect(() => {
    // Check if user is already authenticated in this session
    const authenticated =
      sessionStorage.getItem("planner_authenticated") === "true";
    setIsAuthenticated(authenticated);
  }, []);

  if (!isAuthenticated) {
    return (
      <>
        <PasswordProtection
          onCorrectPassword={() => setIsAuthenticated(true)}
        />
        <Toaster />
      </>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <DailyPlanner initialDate={date || undefined} />
      <Toaster />
    </main>
  );
}
