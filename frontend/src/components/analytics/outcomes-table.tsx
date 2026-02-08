'use client'

import { useState } from 'react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { UserOutcome } from '@/lib/api-client'

interface Props {
  outcomes: UserOutcome[]
}

type SortField = 'planTitle' | 'ticker' | 'pnlLamports' | 'createdAt'
type SortDir = 'asc' | 'desc'

export function OutcomesTable({ outcomes }: Props) {
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const sorted = [...outcomes].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    const aVal = a[sortField] ?? ''
    const bVal = b[sortField] ?? ''
    if (aVal < bVal) return -1 * dir
    if (aVal > bVal) return 1 * dir
    return 0
  })

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <TableHead className="cursor-pointer hover:text-white transition-colors" onClick={() => handleSort(field)}>
      {label} {sortField === field ? (sortDir === 'asc' ? '\u2191' : '\u2193') : ''}
    </TableHead>
  )

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/[0.08]">
          <SortHeader field="planTitle" label="Plan" />
          <SortHeader field="ticker" label="Ticker" />
          <SortHeader field="pnlLamports" label="P&L" />
          <SortHeader field="createdAt" label="Date" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((outcome) => {
          const pnlSol = (outcome.pnlLamports ?? 0) / LAMPORTS_PER_SOL
          return (
            <TableRow key={outcome.id} className="border-white/[0.04]">
              <TableCell className="max-w-[200px] truncate">{outcome.planTitle}</TableCell>
              <TableCell className="text-muted-foreground">{outcome.ticker || '\u2014'}</TableCell>
              <TableCell className={pnlSol >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {pnlSol >= 0 ? '+' : ''}
                {pnlSol.toFixed(4)} SOL
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {new Date(outcome.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
