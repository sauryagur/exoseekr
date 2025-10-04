// Mock API for fetching training and results data
export interface TrainingData {
  epoch: number
  loss: number
  accuracy: number
}

export interface ClassDistribution {
  class: string
  predicted: number
  actual: number
  accuracy: number
}

export interface ModelMetrics {
  overallAccuracy: number
  precision: number
  recall: number
  f1Score: number
}

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function fetchTrainingData(): Promise<TrainingData[]> {
  await delay(800)

  const data: TrainingData[] = []
  for (let i = 1; i <= 50; i++) {
    data.push({
      epoch: i,
      loss: 0.15 * Math.exp(-i / 20) + Math.random() * 0.02,
      accuracy: 0.85 + (1 - Math.exp(-i / 15)) * 0.1 + Math.random() * 0.02,
    })
  }

  return data
}

export async function fetchModelMetrics(): Promise<ModelMetrics> {
  await delay(600)

  return {
    overallAccuracy: 92.5,
    precision: 91.8,
    recall: 93.2,
    f1Score: 92.5,
  }
}

export async function fetchClassDistribution(): Promise<ClassDistribution[]> {
  await delay(700)

  return [
    { class: "Class A", predicted: 140, actual: 135, accuracy: 94.2 },
    { class: "Class B", predicted: 120, actual: 125, accuracy: 91.5 },
    { class: "Class C", predicted: 180, actual: 175, accuracy: 93.8 },
  ]
}

export async function fetchDataDistribution(): Promise<{ x: number; y: number }[]> {
  await delay(750)

  const data: { x: number; y: number }[] = []
  for (let i = 0; i <= 100; i++) {
    const x = i
    const y = 50 + 30 * Math.sin(i / 10) + 20 * Math.cos(i / 5) + Math.random() * 10
    data.push({ x, y })
  }

  return data
}
