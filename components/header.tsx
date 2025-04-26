"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, History, Plus, Repeat, Activity } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          <span className="text-xl font-semibold">Daily Planner</span>
        </div>

        <nav className="flex items-center gap-4">
          <Link href="/">
            <Button
              variant={pathname === "/" ? "default" : "ghost"}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Planner
            </Button>
          </Link>
          <Link href="/progress">
            <Button
              variant={pathname === "/progress" ? "default" : "ghost"}
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              Progress
            </Button>
          </Link>
          <Link href="/recurring">
            <Button
              variant={pathname === "/recurring" ? "default" : "ghost"}
              className="flex items-center gap-2"
            >
              <Repeat className="h-4 w-4" />
              Recurring
            </Button>
          </Link>
          <Link href="/history">
            <Button
              variant={pathname === "/history" ? "default" : "ghost"}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              History
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
