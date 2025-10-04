"use client"

import { useState, Suspense, lazy } from "react"
import Link from "next/link"
import { Play, Pause, Square, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { RingedPlanetIcon } from "@/components/ringed-planet-icon"
import { ChartSkeleton } from "@/components/chart-skeleton"

const TrainingLossChart = lazy(() =>
  import("@/components/charts/training-loss-chart").then((m) => ({ default: m.TrainingLossChart })),
)
const TrainingAccuracyChart = lazy(() =>
  import("@/components/charts/training-accuracy-chart").then((m) => ({ default: m.TrainingAccuracyChart })),
)

export default function TrainingPage() {
  const [epochs, setEpochs] = useState(50)
  const [batchSize, setBatchSize] = useState(32)

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
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
            <Link href="/models" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Models
            </Link>
            <Link href="/training" className="text-sm font-medium text-blue-400">
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

      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-6">
            <Card className="bg-[#0f1420] border-gray-800">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Model Selection</h2>
                <Select defaultValue="cnn">
                  <SelectTrigger className="bg-[#1a1f2e] border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1f2e] border-gray-700">
                    <SelectItem value="cnn">Convolutional Neural Network</SelectItem>
                    <SelectItem value="rnn">Recurrent Neural Network</SelectItem>
                    <SelectItem value="transformer">Transformer</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="bg-[#0f1420] border-gray-800">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Hyperparameter Adjustment</h2>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="learning-rate" className="text-sm text-gray-400">
                      Learning Rate
                    </Label>
                    <Input
                      id="learning-rate"
                      type="number"
                      defaultValue="0.001"
                      step="0.0001"
                      className="mt-2 bg-[#1a1f2e] border-gray-700 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-sm text-gray-400">Epochs ({epochs})</Label>
                    <Slider
                      value={[epochs]}
                      onValueChange={(value) => setEpochs(value[0])}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-sm text-gray-400">Batch Size ({batchSize})</Label>
                    <Slider
                      value={[batchSize]}
                      onValueChange={(value) => setBatchSize(value[0])}
                      max={128}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dropout" className="text-sm text-gray-400">
                      Dropout Rate
                    </Label>
                    <Input
                      id="dropout"
                      type="number"
                      defaultValue="0.5"
                      step="0.1"
                      className="mt-2 bg-[#1a1f2e] border-gray-700 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="weight-decay" className="text-sm text-gray-400">
                      Weight Decay
                    </Label>
                    <Input
                      id="weight-decay"
                      type="number"
                      defaultValue="0.0001"
                      step="0.0001"
                      className="mt-2 bg-[#1a1f2e] border-gray-700 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="optimizer" className="text-sm text-gray-400">
                      Optimizer
                    </Label>
                    <Select defaultValue="adam">
                      <SelectTrigger className="mt-2 bg-[#1a1f2e] border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1f2e] border-gray-700">
                        <SelectItem value="adam">Adam</SelectItem>
                        <SelectItem value="sgd">SGD</SelectItem>
                        <SelectItem value="rmsprop">RMSprop</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-[#0f1420] border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Training Controls</h2>
                  <div className="flex gap-2">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Play className="mr-2 h-4 w-4" />
                      Start Training
                    </Button>
                    <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800 bg-transparent">
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </Button>
                    <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800 bg-transparent">
                      <Square className="mr-2 h-4 w-4" />
                      Stop
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0f1420] border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold text-white">Training Progress</h2>
                  <span className="text-sm text-gray-400">60% complete</span>
                </div>
                <p className="text-sm text-gray-400 mb-4">Epoch 5/50</p>
                <Progress value={60} className="h-2" />
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Suspense fallback={<ChartSkeleton />}>
                <TrainingLossChart />
              </Suspense>
              <Suspense fallback={<ChartSkeleton />}>
                <TrainingAccuracyChart />
              </Suspense>
            </div>

            <Card className="bg-[#0f1420] border-gray-800">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Training Log</h2>
                <div className="bg-[#0a0e1a] rounded-lg p-4 font-mono text-sm text-gray-300 space-y-1">
                  <div>Epoch 1/50, Loss: 0.123, Accuracy: 0.85</div>
                  <div>Epoch 2/50, Loss: 0.105, Accuracy: 0.88</div>
                  <div>Epoch 3/50, Loss: 0.092, Accuracy: 0.90</div>
                  <div>Epoch 4/50, Loss: 0.081, Accuracy: 0.92</div>
                  <div>Epoch 5/50, Loss: 0.075, Accuracy: 0.93</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
