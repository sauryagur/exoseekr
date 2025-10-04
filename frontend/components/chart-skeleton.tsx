import { Card, CardContent } from "@/components/ui/card"

export function ChartSkeleton() {
  return (
    <Card className="bg-[#0f1420] border-gray-800">
      <CardContent className="p-6">
        <div className="h-6 w-48 bg-gray-800 rounded animate-pulse mb-4" />
        <div className="h-64 bg-gray-800/50 rounded animate-pulse" />
      </CardContent>
    </Card>
  )
}

export function MetricSkeleton() {
  return (
    <Card className="bg-[#0f1420] border-gray-800">
      <CardContent className="p-6">
        <div className="h-4 w-32 bg-gray-800 rounded animate-pulse mb-2" />
        <div className="h-10 w-24 bg-gray-800 rounded animate-pulse" />
      </CardContent>
    </Card>
  )
}
