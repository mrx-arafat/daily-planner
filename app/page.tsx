import { Suspense } from "react"
import HomeClient from "./page-client"

export default function Home() {
  return (
    <Suspense fallback={<div className="container mx-auto p-8">Loading...</div>}>
      <HomeClient />
    </Suspense>
  )
}

