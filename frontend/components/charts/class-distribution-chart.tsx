"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Card, CardContent } from "@/components/ui/card"
import { fetchClassDistribution, type ClassDistribution } from "@/lib/mock-api"
import { ChartSkeleton } from "@/components/chart-skeleton"

export function ClassDistributionChart() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [data, setData] = useState<ClassDistribution[] | null>(null)

  useEffect(() => {
    fetchClassDistribution().then(setData)
  }, [])

  useEffect(() => {
    if (!data || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 20, right: 20, bottom: 40, left: 50 }
    const width = 500 - margin.left - margin.right
    const height = 250 - margin.top - margin.bottom

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.class))
      .range([0, width])
      .padding(0.3)

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => Math.max(d.predicted, d.actual)) || 200])
      .range([height, 0])

    // Draw bars for predicted
    g.selectAll(".bar-predicted")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar-predicted")
      .attr("x", (d) => (xScale(d.class) || 0) + xScale.bandwidth() / 4)
      .attr("width", xScale.bandwidth() / 3)
      .attr("y", height)
      .attr("height", 0)
      .attr("fill", "#3b82f6")
      .attr("rx", 4)
      .on("mouseenter", function () {
        d3.select(this).attr("fill", "#60a5fa")
      })
      .on("mouseleave", function () {
        d3.select(this).attr("fill", "#3b82f6")
      })
      .transition()
      .duration(1000)
      .delay((_, i) => i * 100)
      .attr("y", (d) => yScale(d.predicted))
      .attr("height", (d) => height - yScale(d.predicted))

    // Draw bars for actual
    g.selectAll(".bar-actual")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar-actual")
      .attr("x", (d) => (xScale(d.class) || 0) + (xScale.bandwidth() / 4) * 2.5)
      .attr("width", xScale.bandwidth() / 3)
      .attr("y", height)
      .attr("height", 0)
      .attr("fill", "#10b981")
      .attr("rx", 4)
      .on("mouseenter", function () {
        d3.select(this).attr("fill", "#34d399")
      })
      .on("mouseleave", function () {
        d3.select(this).attr("fill", "#10b981")
      })
      .transition()
      .duration(1000)
      .delay((_, i) => i * 100 + 200)
      .attr("y", (d) => yScale(d.actual))
      .attr("height", (d) => height - yScale(d.actual))

    // Add axes
    g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale)).attr("color", "#6b7280")

    g.append("g").call(d3.axisLeft(yScale)).attr("color", "#6b7280")
  }, [data])

  if (!data) return <ChartSkeleton />

  return (
    <Card className="bg-[#0f1420] border-gray-800">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Predicted vs. Actual Class Distribution</h3>
        <div className="flex gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded" />
            <span className="text-gray-400">Predicted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded" />
            <span className="text-gray-400">Actual</span>
          </div>
        </div>
        <svg ref={svgRef} width="500" height="250" className="w-full" />
      </CardContent>
    </Card>
  )
}
