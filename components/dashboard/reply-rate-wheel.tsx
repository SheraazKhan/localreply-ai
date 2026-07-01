"use client"

import { useEffect, useState } from "react"

interface ReplyRateWheelProps {
  percent: number
  label?: string
}

const RADIUS = 40
const STROKE_WIDTH = 8
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function ReplyRateWheel({ percent, label }: ReplyRateWheelProps) {
  const clamped = Math.min(100, Math.max(0, percent))
  const [displayPercent, setDisplayPercent] = useState(0)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDisplayPercent(clamped))
    return () => cancelAnimationFrame(frame)
  }, [clamped])

  const offset = CIRCUMFERENCE - (displayPercent / 100) * CIRCUMFERENCE

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative size-[100px]">
        <svg width={100} height={100} viewBox="0 0 100 100" className="-rotate-90">
          <circle
            cx={50}
            cy={50}
            r={RADIUS}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={STROKE_WIDTH}
          />
          <circle
            cx={50}
            cy={50}
            r={RADIUS}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 350ms cubic-bezier(0.16, 1, 0.3, 1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-semibold">{clamped}%</span>
        </div>
      </div>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  )
}
