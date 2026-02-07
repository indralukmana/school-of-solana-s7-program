'use client'

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

interface Props {
  tickers: Array<{ ticker: string; pnlLamports: number; count: number }>
}

const chartConfig = {
  pnl: {
    label: 'P&L (SOL)',
    color: 'var(--purple-400)',
  },
} satisfies ChartConfig

export function TickerPerformanceChart({ tickers }: Props) {
  const data = tickers.map((t) => ({
    ticker: t.ticker,
    pnl: t.pnlLamports / LAMPORTS_PER_SOL,
  }))

  return (
    <ChartContainer config={chartConfig} className="w-full h-64">
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 40 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" tickLine={false} axisLine={false} />
        <YAxis dataKey="ticker" type="category" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.pnl >= 0 ? 'var(--emerald-400)' : 'var(--red-400)'}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
