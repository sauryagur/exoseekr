"use client"

import { Suspense, lazy, useEffect, useState } from "react"
import Link from "next/link"
import { HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RingedPlanetIcon } from "@/components/ringed-planet-icon"
import { ChartSkeleton, MetricSkeleton } from "@/components/chart-skeleton"
import { fetchModelMetrics, type ModelMetrics } from "@/lib/mock-api"

const ClassDistributionChart = lazy(() =>
  import("@/components/charts/class-distribution-chart").then((m) => ({ default: m.ClassDistributionChart })),
)
const ClassAccuracyChart = lazy(() =>
  import("@/components/charts/class-accuracy-chart").then((m) => ({ default: m.ClassAccuracyChart })),
)
const DataDistributionChart = lazy(() =>
  import("@/components/charts/data-distribution-chart").then((m) => ({ default: m.DataDistributionChart })),
)

export default function ResultsPage() {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null)

  useEffect(() => {
    fetchModelMetrics().then(setMetrics)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0a0e1a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0a0e1a]/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
              <RingedPlanetIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-white">exoseekr</span>
          </div>
          <nav className="flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/upload" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Upload
            </Link>
            <Link href="/models" className="text-sm font-medium text-blue-400">
              Models
            </Link>
            <Link href="/training" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Training
            </Link>
            <Link href="/results" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Results
            </Link>
          </nav>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-white mb-2">Model Performance Summary</h1>
        <p className="text-gray-400 mb-8">
          Explore detailed metrics and visualizations for the model's performance on exoplanetary data classification.
        </p>

        {/* Performance Metrics */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          {!metrics ? (
            <>
              <MetricSkeleton />
              <MetricSkeleton />
              <MetricSkeleton />
              <MetricSkeleton />
            </>
          ) : (
            <>
              <Card className="bg-[#0f1420] border-gray-800">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-400 mb-2">Overall Accuracy</p>
                  <p className="text-4xl font-bold text-white">{metrics.overallAccuracy}%</p>
                </CardContent>
              </Card>

              <Card className="bg-[#0f1420] border-gray-800">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-400 mb-2">Precision</p>
                  <p className="text-4xl font-bold text-white">{metrics.precision}%</p>
                </CardContent>
              </Card>

              <Card className="bg-[#0f1420] border-gray-800">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-400 mb-2">Recall</p>
                  <p className="text-4xl font-bold text-white">{metrics.recall}%</p>
                </CardContent>
              </Card>

              <Card className="bg-[#0f1420] border-gray-800">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-400 mb-2">F1-Score</p>
                  <p className="text-4xl font-bold text-white">{metrics.f1Score}%</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Classification Results */}
        <h2 className="text-2xl font-bold text-white mb-6">Classification Results</h2>
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <Suspense fallback={<ChartSkeleton />}>
            <ClassDistributionChart />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <ClassAccuracyChart />
          </Suspense>
        </div>

        {/* Data Distribution */}
        <h2 className="text-2xl font-bold text-white mb-6">Data Distribution</h2>
        <Suspense fallback={<ChartSkeleton />}>
          <DataDistributionChart />
        </Suspense>
      </main>
    </div>
  )
}
