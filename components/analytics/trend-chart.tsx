"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts"

interface TrendData {
  year: number
  cutoff: number
  [key: string]: any
}

interface TrendChartProps {
  data: TrendData[]
  title?: string
  type?: "line" | "bar"
  showPrediction?: boolean
  predictedData?: TrendData[]
}

export function TrendChart({ data, title, type = "line", showPrediction = false, predictedData = [] }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No historical data available</p>
      </div>
    )
  }

  // Sort data by year
  const sortedData = [...data].sort((a, b) => a.year - b.year)
  
  // Combine historical and predicted data
  const chartData = showPrediction && predictedData.length > 0
    ? [...sortedData, ...predictedData].sort((a, b) => a.year - b.year)
    : sortedData

  const ChartComponent = type === "bar" ? BarChart : LineChart

  return (
    <div className="w-full h-64 sm:h-80">
      {title && <h3 className="text-sm font-semibold mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="year" 
            className="text-xs"
            tick={{ fill: "currentColor", fontSize: 12 }}
          />
          <YAxis 
            className="text-xs"
            tick={{ fill: "currentColor", fontSize: 12 }}
            label={{ value: "Cutoff", angle: -90, position: "insideLeft", style: { textAnchor: "middle" } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="cutoff" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", r: 4 }}
            name="Historical Cutoff"
          />
          {showPrediction && predictedData.length > 0 && (
            <Line 
              type="monotone" 
              dataKey="cutoff" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
              name="Predicted Cutoff"
              data={predictedData}
            />
          )}
          {type === "bar" && (
            <Bar dataKey="cutoff" fill="hsl(var(--primary))" name="Cutoff" />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  )
}

