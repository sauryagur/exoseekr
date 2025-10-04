"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Card, CardContent } from "@/components/ui/card"
import { fetchTrainingData, type TrainingData } from "@/lib/mock-api"
import { ChartSkeleton } from "@/components/chart-skeleton"

export function TrainingLossChart() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [data, setData] = useState<TrainingData[] | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<TrainingData | null>(null)

  useEffect(() => {
    fetchTrainingData().then(setData)
  }, [])

  useEffect(() => {
    if (!data || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 20, right: 20, bottom: 40, left: 50 }
    const width = 400 - margin.left - margin.right
    const height = 200 - margin.top - margin.bottom

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([1, d3.max(data, (d) => d.epoch) || 50])
      .range([0, width])

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.loss) || 0.2])
      .range([height, 0])

    // Line generator
    const line = d3
      .line<TrainingData>()
      .x((d) => xScale(d.epoch))
      .y((d) => yScale(d.loss))
      .curve(d3.curveMonotoneX)

    // Draw line
    const path = g
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2)
      .attr("d", line)

    // Animate line
    const totalLength = path.node()?.getTotalLength() || 0
    path
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(1500)
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0)

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .attr("color", "#6b7280")

    g.append("g").call(d3.axisLeft(yScale).ticks(5)).attr("color", "#6b7280")

    // Add interactive dots
    g.selectAll(".dot")
      .data(data.filter((_, i) => i % 5 === 0))
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => xScale(d.epoch))
      .attr("cy", (d) => yScale(d.loss))
      .attr("r", 4)
      .attr("fill", "#3b82f6")
      .attr("opacity", 0)
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("opacity", 1).attr("r", 6)
        setHoveredPoint(d)
      })
      .on("mouseleave", function () {
        d3.select(this).attr("opacity", 0).attr("r", 4)
        setHoveredPoint(null)
      })
  }, [data])

  if (!data) return <ChartSkeleton />

  const currentLoss = data[data.length - 1]?.loss || 0
  const previousLoss = data[data.length - 2]?.loss || 0
  const change = (((currentLoss - previousLoss) / previousLoss) * 100).toFixed(1)

  return (
    <Card className="bg-[#0f1420] border-gray-800">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Loss over Epochs</h3>
        <div className="text-3xl font-bold text-white mb-1">
          {hoveredPoint ? hoveredPoint.loss.toFixed(3) : currentLoss.toFixed(3)}
        </div>
        <p className={`text-sm mb-4 ${Number.parseFloat(change) < 0 ? "text-green-400" : "text-red-400"}`}>
          {change}% from previous epoch
        </p>
        <svg ref={svgRef} width="400" height="200" className="w-full" />
      </CardContent>
    </Card>
  )
}
