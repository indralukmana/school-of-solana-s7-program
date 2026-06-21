'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useApiOutcomes } from '@/hooks/use-api-outcomes'
import { addOutcome, postEvent } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldLabel } from '@/components/ui/field'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Edit3, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

export function OutcomePanel({ planHash, vaultAddress }: { planHash: string; vaultAddress: string }) {
  const { publicKey } = useWallet()
  const { data: outcomes } = useApiOutcomes(planHash)
  const queryClient = useQueryClient()
  const existing = outcomes?.[0]
  const [editing, setEditing] = useState(!existing)
  const [pnlSol, setPnlSol] = useState(existing ? ((existing.pnlLamports ?? 0) / LAMPORTS_PER_SOL).toString() : '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const pnlLamports = parseFloat(pnlSol) * LAMPORTS_PER_SOL
      await addOutcome(planHash, {
        pnlLamports: isNaN(pnlLamports) ? undefined : pnlLamports,
        notes,
        settledAt: new Date().toISOString(),
      })
      queryClient.invalidateQueries({ queryKey: ['api-outcomes', planHash] })
      queryClient.invalidateQueries({ queryKey: ['api-analytics'] })
      queryClient.invalidateQueries({ queryKey: ['api-activity'] })
      queryClient.invalidateQueries({ queryKey: ['get-vaults'] })
      if (publicKey) {
        postEvent({
          eventType: 'outcome_added',
          actorId: publicKey.toBase58(),
          vaultAddress,
          metadata: JSON.stringify({ pnlLamports }),
        })
      }
      setEditing(false)
      toast.success(existing ? 'Outcome updated' : 'Outcome added')
    } catch {
      toast.error('Failed to save outcome')
    } finally {
      setSubmitting(false)
    }
  }

  const startEditing = () => {
    setPnlSol(existing ? ((existing.pnlLamports ?? 0) / LAMPORTS_PER_SOL).toString() : '')
    setNotes(existing?.notes ?? '')
    setEditing(true)
  }

  return (
    <div className="space-y-4">
      {existing && !editing && (
        <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
          <div className="flex justify-between items-start">
            <div>
              <span
                className={`font-mono font-bold ${(existing.pnlLamports ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {(existing.pnlLamports ?? 0) >= 0 ? '+' : ''}
                {(existing.pnlLamports ?? 0) / LAMPORTS_PER_SOL} SOL
              </span>
              {existing.notes && <p className="text-sm mt-1 whitespace-pre-wrap">{existing.notes}</p>}
            </div>
            <Button variant="ghost" size="sm" onClick={startEditing}>
              <Edit3 className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
        </div>
      )}

      {editing && (
        <div className="border-t border-white/[0.06] pt-4">
          <p className="text-sm font-medium mb-2">{existing ? 'Edit Outcome' : 'Add Outcome'}</p>
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
          <div className="flex gap-2 mt-2">
            <Button variant="secondary" size="sm" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : existing ? 'Update Outcome' : 'Add Outcome'}
            </Button>
            {existing && (
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
