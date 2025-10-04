"use client"

import { useState, useEffect } from "react"
import Joyride, { type CallBackProps, STATUS, type Step } from "react-joyride"
import { usePathname, useRouter } from "next/navigation"

const tourSteps: Step[] = [
  {
    target: "body",
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Welcome to exoseekr!</h3>
        <p>
          Your AI-driven platform for detecting exoplanet transits in TESS/Kepler light curves. Let's take a quick tour
          of all the features.
        </p>
      </div>
    ),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="dashboard-link"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Dashboard</h3>
        <p>
          Your central hub showing dataset statistics, active model performance, and recent activity. Monitor your
          exoplanet detection pipeline at a glance.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="stats-cards"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Dataset Statistics</h3>
        <p>
          Track your total datasets (125), processed datasets (100), and pending datasets (25). These metrics help you
          understand your data pipeline status.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="model-status"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Active Model Status</h3>
        <p>
          View your currently deployed model's performance. The Exoplanet Classifier v3 is achieving 92.5% accuracy in
          detecting transit events.
        </p>
      </div>
    ),
    placement: "top",
  },
  {
    target: '[data-tour="recent-activity"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Recent Activity Feed</h3>
        <p>
          Stay updated with the latest events: completed training runs, new dataset uploads, and processing status
          updates.
        </p>
      </div>
    ),
    placement: "top",
  },
  {
    target: '[data-tour="upload-link"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Upload Page</h3>
        <p>
          Ingest new light curve data from TESS or Kepler missions. Upload CSV files containing time-series photometry
          data for transit detection.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="models-link"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Models Library</h3>
        <p>
          Browse and manage your trained models. View model architectures, performance metrics, and switch between
          different model versions (mutable/backup).
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="training-link"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Training Page</h3>
        <p>
          Train new models with customizable hyperparameters. Adjust learning rate, epochs, batch size, dropout rate,
          and optimizer settings. Monitor real-time training progress with loss and accuracy charts.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="results-link"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Results Page</h3>
        <p>
          Explore detailed model performance metrics including accuracy, precision, recall, and F1-score. Visualize
          classification results and data distribution across different exoplanet classes.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="discoveries-link"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Discoveries Page</h3>
        <p>
          View confirmed exoplanet discoveries detected by your AI models. Each discovery includes detailed information
          about distance, radius, temperature, and habitability potential.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: "body",
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">You're all set!</h3>
        <p>
          Start by uploading light curve data, train your models with custom hyperparameters, and discover new
          exoplanets. Click the help icon anytime to restart this tour.
        </p>
      </div>
    ),
    placement: "center",
  },
]

export function AppTour() {
  const [run, setRun] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [hasSeenTour, setHasSeenTour] = useState(true) 
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("exoseekr-tour-completed")
    if (!hasSeenTour) {
      setRun(true)
    }
  }, [])

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, action } = data

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRun(false)
      localStorage.setItem("exoseekr-tour-completed", "true")
      setHasSeenTour(true)
    }

    
    if (action === "next" || action === "prev") {
      
      if (index === 5 && pathname !== "/upload") {
        router.push("/upload")
      } else if (index === 6 && pathname !== "/models") {
        router.push("/models")
      } else if (index === 7 && pathname !== "/training") {
        router.push("/training")
      } else if (index === 8 && pathname !== "/results") {
        router.push("/results")
      } else if (index === 9 && pathname !== "/discoveries") {
        router.push("/discoveries")
      } else if (index === 10 && pathname !== "/") {
        router.push("/")
      }
    }
  }

  const startTour = () => {
    setRun(true)
    
    if (pathname !== "/") {
      router.push("/")
    }
  }

  const resetAndStartTour = () => {
    localStorage.removeItem("exoseekr-tour-completed")
    setHasSeenTour(false)
    startTour()
  }
  useEffect(() => {
    setIsClient(true)
    
    
    const tourCompleted = localStorage.getItem('exoseekr-tour-completed')
    if (!tourCompleted) {
      setHasSeenTour(false)
      
      const timer = setTimeout(() => {
        setRun(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  
  useEffect(() => {
    ;(window as any).startExoseekrTour = startTour
    ;(window as any).resetExoseekrTour = resetAndStartTour
    
    ;(window as any).clearExoseekrTour = () => {
      localStorage.removeItem("exoseekr-tour-completed")
      setHasSeenTour(false)
      console.log("Tour completion flag cleared. Refresh page to see tour on next visit.")
    }
  }, [startTour, resetAndStartTour])

  
  if (!isClient) {
    return null
  }

  return (
    <Joyride
      steps={tourSteps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "#3b82f6",
          textColor: "#e5e7eb",
          backgroundColor: "#1f2937",
          overlayColor: "rgba(0, 0, 0, 0.7)",
          arrowColor: "#1f2937",
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 8,
          padding: 20,
        },
        tooltipContent: {
          padding: "10px 0",
        },
        buttonNext: {
          backgroundColor: "#3b82f6",
          borderRadius: 6,
          padding: "8px 16px",
        },
        buttonBack: {
          color: "#9ca3af",
          marginRight: 10,
        },
        buttonSkip: {
          color: "#9ca3af",
        },
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish",
        next: "Next",
        skip: "Skip Tour",
      }}
    />
  )
}
