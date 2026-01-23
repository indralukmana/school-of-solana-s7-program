'use client'

import { useState } from 'react'
import { useApiOutcomes } from '@/hooks/use-api-outcomes'
import { addOutcome } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldLabel } from '@/components/ui/field'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

export function OutcomePanel({ planHash }: { planHash: string }) {
  const { data: outcomes } = useApiOutcomes(planHash)
  const queryClient = useQueryClient()
  const [pnlSol, setPnlSol] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleAdd = async () => {
    setSubmitting(true)
    try {
      const pnlLamports = parseFloat(pnlSol) * LAMPORTS_PER_SOL
      await addOutcome(planHash, {
        pnlLamports: isNaN(pnlLamports) ? undefined : pnlLamports,
        notes,
        settledAt: new Date().toISOString(),
      })
      queryClient.invalidateQueries({ queryKey: ['api-outcomes', planHash] })
      setPnlSol('')
      setNotes('')
      toast.success('Outcome added')
    } catch {
      toast.error('Failed to add outcome')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {outcomes && outcomes.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Trade Outcomes</p>
          {outcomes.map((o) => (
            <div key={o.id} className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
              <div className="flex justify-between items-start">
                <span
                  className={`font-mono font-bold ${(o.pnlLamports ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  {(o.pnlLamports ?? 0) >= 0 ? '+' : ''}
                  {(o.pnlLamports ?? 0) / LAMPORTS_PER_SOL} SOL
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(o.createdAt).toLocaleDateString()}
                </span>
              </div>
              {o.notes && <p className="text-sm mt-1 whitespace-pre-wrap">{o.notes}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-white/[0.06] pt-4">
        <p className="text-sm font-medium mb-2">Add Outcome</p>
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="pnl">P&L (SOL)</FieldLabel>
            <Input
              id="pnl"
              type="number"
              step="0.01"
              placeholder="+0.5 or -0.2"
              value={pnlSol}
              onChange={(e) => setPnlSol(e.target.value)}
            />
          </Field>
        </div>
        <Field className="mt-2">
          <FieldLabel htmlFor="outcome-notes">Notes</FieldLabel>
          <Textarea
            id="outcome-notes"
            placeholder="What happened?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </Field>
        <Button variant="secondary" size="sm" className="mt-2" onClick={handleAdd} disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Outcome'}
        </Button>
      </div>
    </div>
  )
}
