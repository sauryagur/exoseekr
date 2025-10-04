import Link from "next/link"
import { Database, HelpCircle, TrendingUp, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function ModelsPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0a0e1a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0a0e1a]/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
              <Database className="h-6 w-6 text-white" />
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Model Library</h1>
            <p className="text-gray-400">Manage and compare your exoplanet detection models.</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Zap className="mr-2 h-4 w-4" />
            Train New Model
          </Button>
        </div>

        {/* Model Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Active Model */}
          <Card className="bg-[#0f1420] border-blue-600">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge className="bg-blue-600 text-white mb-2">Active</Badge>
                  <h3 className="text-lg font-semibold text-white">Exoplanet Classifier v3</h3>
                  <p className="text-sm text-gray-400 mt-1">Convolutional Neural Network</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Accuracy</span>
                  <span className="text-sm font-semibold text-green-400">92.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Precision</span>
                  <span className="text-sm font-semibold text-white">91.8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Recall</span>
                  <span className="text-sm font-semibold text-white">93.2%</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-gray-700 text-white hover:bg-gray-800 bg-transparent"
                >
                  View Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-gray-700 text-white hover:bg-gray-800 bg-transparent"
                >
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Results
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Model 2 */}
          <Card className="bg-[#0f1420] border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge variant="outline" className="border-gray-700 text-gray-400 mb-2">
                    Backup
                  </Badge>
                  <h3 className="text-lg font-semibold text-white">Exoplanet Classifier v2</h3>
                  <p className="text-sm text-gray-400 mt-1">Recurrent Neural Network</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Accuracy</span>
                  <span className="text-sm font-semibold text-white">89.3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Precision</span>
                  <span className="text-sm font-semibold text-white">88.7%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Recall</span>
                  <span className="text-sm font-semibold text-white">90.1%</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-gray-700 text-white hover:bg-gray-800 bg-transparent"
                >
                  View Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-gray-700 text-white hover:bg-gray-800 bg-transparent"
                >
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Results
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Model 3 */}
          <Card className="bg-[#0f1420] border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge variant="outline" className="border-gray-700 text-gray-400 mb-2">
                    Archived
                  </Badge>
                  <h3 className="text-lg font-semibold text-white">Exoplanet Classifier v1</h3>
                  <p className="text-sm text-gray-400 mt-1">Random Forest</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Accuracy</span>
                  <span className="text-sm font-semibold text-white">85.1%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Precision</span>
                  <span className="text-sm font-semibold text-white">84.3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Recall</span>
                  <span className="text-sm font-semibold text-white">86.2%</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-gray-700 text-white hover:bg-gray-800 bg-transparent"
                >
                  View Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-gray-700 text-white hover:bg-gray-800 bg-transparent"
                >
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Results
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
