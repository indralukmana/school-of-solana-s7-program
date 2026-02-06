'use client'

import { Bar, BarChart, CartesianGrid, Cell, XAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

interface Props {
  months: Array<{ month: string; pnlLamports: number; count: number }>
}

const chartConfig = {
  pnl: {
    label: 'P&L (SOL)',
    color: 'var(--emerald-400)',
  },
} satisfies ChartConfig

export function PnlOverTimeChart({ months }: Props) {
  const data = months.map((m) => ({
    month: formatMonth(m.month),
    pnl: m.pnlLamports / LAMPORTS_PER_SOL,
  }))

  return (
    <ChartContainer config={chartConfig} className="w-full h-64">
      <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
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

function formatMonth(monthStr: string): string {
  const [y, m] = monthStr.split('-')
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  return `${months[parseInt(m) - 1]} ${y}`
}
