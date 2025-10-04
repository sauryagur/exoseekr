"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Upload, FileText, CheckCircle2, FingerprintIcon as RingedPlanetIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

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
            <Link href="/upload" className="text-sm font-medium text-blue-400">
              Upload
            </Link>
            <Link href="/models" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Models
            </Link>
            <Link href="/training" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Training
            </Link>
            <Link href="/results" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Results
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-2">Upload Dataset</h1>
        <p className="text-gray-400 mb-8">Upload your exoplanet light curve data for processing and analysis.</p>

        {/* Upload Card */}
        <Card className="bg-[#0f1420] border-gray-800 mb-6">
          <CardContent className="p-8">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive ? "border-blue-500 bg-blue-500/5" : "border-gray-700"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Drop your files here</h3>
              <p className="text-sm text-gray-400 mb-4">or click to browse</p>
              <Input type="file" className="hidden" id="file-upload" accept=".csv,.fits,.txt" multiple />
              <div className="flex justify-center">
                <Label htmlFor="file-upload">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
                    <span>Select Files</span>
                  </Button>
                </Label>
              </div>
              <p className="text-xs text-gray-500 mt-4">Supported formats: CSV, FITS, TXT (Max 100MB)</p>
            </div>
          </CardContent>
        </Card>

        {/* Dataset Info */}
        <Card className="bg-[#0f1420] border-gray-800 mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Dataset Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="dataset-name" className="text-sm text-gray-400">
                  Dataset Name
                </Label>
                <Input
                  id="dataset-name"
                  placeholder="e.g., Kepler-186f Observations"
                  className="mt-2 bg-[#1a1f2e] border-gray-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-sm text-gray-400">
                  Description (Optional)
                </Label>
                <Input
                  id="description"
                  placeholder="Brief description of the dataset"
                  className="mt-2 bg-[#1a1f2e] border-gray-700 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Uploads */}
        <Card className="bg-[#0f1420] border-gray-800">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Uploads</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#1a1f2e]">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Kepler-186f Observations</p>
                    <p className="text-xs text-gray-500">2.4 MB • Yesterday</p>
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#1a1f2e]">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-white">TESS Sector 42 Data</p>
                    <p className="text-xs text-gray-500">5.1 MB • 2 days ago</p>
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800 bg-transparent">
            Cancel
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">Upload Dataset</Button>
        </div>
      </main>
    </div>
  )
}
