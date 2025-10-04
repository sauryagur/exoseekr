"use client"

import Link from "next/link"
import { CheckCircle2, Clock, Dumbbell, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RingedPlanetIcon } from "@/components/ringed-planet-icon"

export default function DashboardPage() {
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
            <Link href="/" className="text-sm font-medium text-blue-400" data-tour="dashboard-link">
              Dashboard
            </Link>
            <Link
              href="/upload"
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              data-tour="upload-link"
            >
              Upload
            </Link>
            <Link
              href="/models"
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              data-tour="models-link"
            >
              Models
            </Link>
            <Link
              href="/training"
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              data-tour="training-link"
            >
              Training
            </Link>
            <Link
              href="/results"
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              data-tour="results-link"
            >
              Results
            </Link>
            <Link
              href="/discoveries"
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              data-tour="discoveries-link"
            >
              Discoveries
            </Link>
          </nav>
          <button
            onClick={() => (window as any).startExoseekrTour?.()}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-700 bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            aria-label="Start guided tour"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Exoplanet AI Dashboard</h1>
            <p className="text-gray-400">Overview of your exoplanetary data and models.</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Upload New Data
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8" data-tour="stats-cards">
          <Card className="bg-[#0f1420] border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                  <RingedPlanetIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Datasets</p>
                  <p className="text-3xl font-bold text-white">125</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0f1420] border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Datasets Processed</p>
                  <p className="text-3xl font-bold text-white">100</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0f1420] border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/10">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Datasets Pending</p>
                  <p className="text-3xl font-bold text-white">25</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Model Status and Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Model Status */}
          <Card className="bg-[#0f1420] border-gray-800" data-tour="model-status">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Model Status</h2>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-1">Active Model: Exoplanet Classifier v3</h3>
                <p className="text-sm text-gray-400">
                  Accuracy: <span className="text-green-400 font-semibold">92.5%</span>
                </p>
                <Button
                  variant="outline"
                  className="mt-4 border-blue-600 text-blue-400 hover:bg-blue-600/10 bg-transparent"
                >
                  View Details
                </Button>
              </div>

              {/* Exoplanet visualization */}
              <div className="relative h-48 rounded-lg bg-gradient-to-br from-teal-900/20 via-emerald-900/20 to-cyan-900/20 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal-500/20"
                        style={{
                          width: `${80 + i * 40}px`,
                          height: `${40 + i * 20}px`,
                          transform: `translate(-50%, -50%) rotate(${i * 15}deg)`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-[#0f1420] border-gray-800" data-tour="recent-activity">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Recent Activity</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 mt-1">
                    <CheckCircle2 className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">
                      Model training completed for Exoplanet Classifier v3
                    </p>
                    <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 mt-1">
                    <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">New dataset 'Kepler-186f Observations' uploaded</p>
                    <p className="text-xs text-gray-500 mt-1">Yesterday</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 mt-1">
                    <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">
                      Data processing started for 'Kepler-186f Observations'
                    </p>
                    <p className="text-xs text-gray-500 mt-1">2 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-[#0f1420] border-gray-800 mt-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
            <div className="flex gap-4">
              <Link href="/training">
                <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800 bg-transparent">
                  <Dumbbell className="mr-2 h-4 w-4" />
                  Train Model
                </Button>
              </Link>
              <Link href="/results">
                <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800 bg-transparent">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Visualize Results
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
