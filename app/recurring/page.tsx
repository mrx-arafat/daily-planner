import RecurringTasks from "@/components/recurring-tasks"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function RecurringTasksPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Planner
          </Button>
        </Link>
      </div>

      <h1 className="text-3xl font-semibold mb-6">Recurring Tasks</h1>
      <RecurringTasks />
    </div>
  )
}

