"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Card, CardContent } from "@/components/ui/card"
import { fetchDataDistribution } from "@/lib/mock-api"
import { ChartSkeleton } from "@/components/chart-skeleton"

export function DataDistributionChart() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [data, setData] = useState<{ x: number; y: number }[] | null>(null)

  useEffect(() => {
    fetchDataDistribution().then(setData)
  }, [])

  useEffect(() => {
    if (!data || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 20, right: 20, bottom: 40, left: 50 }
    const width = 1100 - margin.left - margin.right
    const height = 250 - margin.top - margin.bottom

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.x) || 100])
      .range([0, width])

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.y) || 100])
      .range([height, 0])

    // Area generator
    const area = d3
      .area<{ x: number; y: number }>()
      .x((d) => xScale(d.x))
      .y0(height)
      .y1((d) => yScale(d.y))
      .curve(d3.curveCatmullRom)

    // Line generator
    const line = d3
      .line<{ x: number; y: number }>()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .curve(d3.curveCatmullRom)

    // Draw area
    g.append("path").datum(data).attr("fill", "#3b82f6").attr("fill-opacity", 0.1).attr("d", area)

    // Draw line
    const path = g
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 3)
      .attr("d", line)

    // Animate line
    const totalLength = path.node()?.getTotalLength() || 0
    path
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(2000)
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0)

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(10))
      .attr("color", "#6b7280")

    g.append("g").call(d3.axisLeft(yScale).ticks(5)).attr("color", "#6b7280")

    // Add class labels
    const classPositions = [
      { label: "Class A", x: width * 0.2 },
      { label: "Class B", x: width * 0.5 },
      { label: "Class C", x: width * 0.8 },
    ]

    classPositions.forEach(({ label, x }) => {
      g.append("text")
        .attr("x", x)
        .attr("y", height + 30)
        .attr("text-anchor", "middle")
        .attr("fill", "#9ca3af")
        .attr("font-size", "12px")
        .text(label)
    })
  }, [data])

  if (!data) return <ChartSkeleton />

  return (
    <Card className="bg-[#0f1420] border-gray-800">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Data Distribution Across Classes</h3>
        <svg ref={svgRef} width="1100" height="250" className="w-full" />
      </CardContent>
    </Card>
  )
}
