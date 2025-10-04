"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

interface TourStep {
  id: string
  title: string
  content: string
  target?: string
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to ExoSeekr!",
    content: "Your professional AI-driven platform for detecting exoplanet transits in TESS/Kepler light curves. Let's explore the key features."
  },
  {
    id: "dashboard",
    title: "Dashboard Overview",
    content: "Monitor your dataset statistics, model performance, and recent activity from your central hub."
  },
  {
    id: "data-management",
    title: "Data Management",
    content: "Upload, process, and manage your TESS/Kepler light curve datasets with our intuitive interface."
  },
  {
    id: "model-training",
    title: "Model Training",
    content: "Train and fine-tune machine learning models for exoplanet detection with customizable hyperparameters."
  },
  {
    id: "results-analysis",
    title: "Results & Analysis",
    content: "Analyze detection results, view confidence scores, and explore detailed visualizations of your findings."
  }
]

export function AppTour() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasShown, setHasShown] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Show tour on first visit to the homepage
    if (pathname === "/" && !hasShown) {
      const tourShown = localStorage.getItem("exoseekr-tour-shown")
      if (!tourShown) {
        setIsOpen(true)
        setHasShown(true)
      }
    }
  }, [pathname, hasShown])

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleClose()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setCurrentStep(0)
    localStorage.setItem("exoseekr-tour-shown", "true")
  }

  const handleSkip = () => {
    handleClose()
  }

  if (!isOpen) return null

  const step = tourSteps[currentStep]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="mx-4 w-full max-w-md bg-[#0a0e1a] border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold text-white">
            {step.title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300 leading-relaxed">
            {step.content}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === currentStep
                      ? "bg-blue-500"
                      : index < currentStep
                      ? "bg-blue-300"
                      : "bg-gray-600"
                  }`}
                />
              ))}
            </div>
            
            <div className="flex items-center space-x-2">
              {currentStep === 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-gray-400 hover:text-white"
                >
                  Skip Tour
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  className="text-gray-400 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
              )}
              
              <Button
                onClick={handleNext}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {currentStep === tourSteps.length - 1 ? (
                  "Get Started"
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="text-center text-sm text-gray-500">
            Step {currentStep + 1} of {tourSteps.length}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}