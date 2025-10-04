"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Card, CardContent } from "@/components/ui/card"
import { fetchClassDistribution, type ClassDistribution } from "@/lib/mock-api"
import { ChartSkeleton } from "@/components/chart-skeleton"

export function ClassAccuracyChart() {
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

    const yScale = d3.scaleLinear().domain([0, 100]).range([height, 0])

    // Draw bars
    g.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScale(d.class) || 0)
      .attr("width", xScale.bandwidth())
      .attr("y", height)
      .attr("height", 0)
      .attr("fill", "#3b82f6")
      .attr("rx", 4)
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("fill", "#60a5fa")
        // Show tooltip
        g.append("text")
          .attr("class", "tooltip")
          .attr("x", (xScale(d.class) || 0) + xScale.bandwidth() / 2)
          .attr("y", yScale(d.accuracy) - 10)
          .attr("text-anchor", "middle")
          .attr("fill", "white")
          .attr("font-size", "12px")
          .text(`${d.accuracy.toFixed(1)}%`)
      })
      .on("mouseleave", function () {
        d3.select(this).attr("fill", "#3b82f6")
        g.selectAll(".tooltip").remove()
      })
      .transition()
      .duration(1000)
      .delay((_, i) => i * 150)
      .attr("y", (d) => yScale(d.accuracy))
      .attr("height", (d) => height - yScale(d.accuracy))

    // Add axes
    g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale)).attr("color", "#6b7280")

    g.append("g").call(d3.axisLeft(yScale).ticks(5)).attr("color", "#6b7280")
  }, [data])

  if (!data) return <ChartSkeleton />

  return (
    <Card className="bg-[#0f1420] border-gray-800">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Class-Specific Accuracy</h3>
        <svg ref={svgRef} width="500" height="250" className="w-full" />
      </CardContent>
    </Card>
  )
}
