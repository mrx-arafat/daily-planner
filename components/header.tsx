"use client";

import Link from "next/link";
import { Calendar } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b bg-white py-2">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span className="text-base">Daily Planner</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
            >
              <span className="text-lg">+</span>
              <span>New Planner</span>
            </Link>
            <Link
              href="/analytics"
              className="text-blue-600 hover:text-blue-700"
            >
              Analytics
            </Link>
            <Link
              href="/recurring"
              className="text-blue-600 hover:text-blue-700"
            >
              Recurring
            </Link>
            <Link href="/history" className="text-blue-600 hover:text-blue-700">
              History
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
