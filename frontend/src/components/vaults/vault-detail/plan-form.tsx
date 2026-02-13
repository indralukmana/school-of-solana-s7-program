'use client'

import { useState } from 'react'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useSubmitPlan } from '@/hooks/use-submit-plan'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldLabel } from '@/components/ui/field'
import { Loader2, Upload } from 'lucide-react'
import { getUploadUrls, uploadImage, type PlanContent } from '@/lib/api-client'

interface PlanFormProps {
  vaultAddress: PublicKey
  planPda: PublicKey | null
  vaultTitle: string
}

export function PlanForm({ vaultAddress, planPda, vaultTitle }: PlanFormProps) {
  const [planDetails, setPlanDetails] = useState({
    tradingPlatform: '',
    riskLevel: '',
    ticker: '',
    investmentAmount: 0,
    stopLossBps: 0,
    takeProfitBps: 0,
    description: '',
  })
  const [errors, setErrors] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const submitPlan = useSubmitPlan(vaultAddress, planPda)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setPlanDetails((prev) => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { urls } = await getUploadUrls(1)
      await uploadImage(urls[0].uploadUrl, file)
      setImageUrls((prev) => [...prev, urls[0].publicUrl])
    } catch {
      // silently fail, image is optional
    } finally {
      setUploading(false)
    }
  }

  const validate = (): string[] => {
    const e: string[] = []
    if (!planDetails.tradingPlatform.trim()) e.push('Trading platform is required')
    if (!planDetails.riskLevel.trim()) e.push('Risk level is required')
    if (!planDetails.ticker.trim()) e.push('Ticker is required')
    if (planDetails.ticker.length > 10) e.push('Ticker must not exceed 10 characters')
    if (planDetails.investmentAmount <= 0) e.push('Investment amount must be greater than 0')
    if (planDetails.stopLossBps <= 0) e.push('Stop loss must be greater than 0 bps')
    if (planDetails.takeProfitBps <= 0) e.push('Take profit must be greater than 0 bps')
    return e
  }

  const handleSubmit = () => {
    const validationErrors = validate()
    setErrors(validationErrors)
    if (validationErrors.length === 0) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://plan-vault-api.workers.dev'
      const content: PlanContent = {
        title: vaultTitle,
        description: planDetails.description,
        tradingPlatform: planDetails.tradingPlatform,
        riskLevel: planDetails.riskLevel,
        ticker: planDetails.ticker,
        investmentLamports: planDetails.investmentAmount * LAMPORTS_PER_SOL,
        stopLossBps: planDetails.stopLossBps,
        takeProfitBps: planDetails.takeProfitBps,
        imageUrls,
        vaultAddress: vaultAddress.toBase58(),
        contentUri: `${apiUrl}/api/plans/placeholder`,
        tags: [],
      }
      submitPlan.mutate(content)
    }
  }

  if (!planPda) return null

  const isLoading = submitPlan.isPending

  return (
    <div className="space-y-4">
      {errors.length > 0 && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
          <ul className="list-disc list-inside">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="tradingPlatform">Trading Platform</FieldLabel>
          <Input id="tradingPlatform" name="tradingPlatform" placeholder="e.g. Binance" onChange={handleChange} disabled={isLoading} />
        </Field>
        <Field>
          <FieldLabel htmlFor="riskLevel">Risk Level</FieldLabel>
          <Input id="riskLevel" name="riskLevel" placeholder="e.g. High" onChange={handleChange} disabled={isLoading} />
        </Field>
        <Field>
          <FieldLabel htmlFor="ticker">Ticker</FieldLabel>
          <Input id="ticker" name="ticker" placeholder="e.g. SOL" onChange={handleChange} disabled={isLoading} maxLength={10} />
        </Field>
        <Field>
          <FieldLabel htmlFor="investmentAmount">Investment (SOL)</FieldLabel>
          <Input id="investmentAmount" name="investmentAmount" type="number" placeholder="0.0" onChange={handleChange} disabled={isLoading} />
        </Field>
        <Field>
          <FieldLabel htmlFor="stopLossBps">Stop Loss (bps)</FieldLabel>
          <Input id="stopLossBps" name="stopLossBps" type="number" placeholder="100" onChange={handleChange} disabled={isLoading} />
        </Field>
        <Field>
          <FieldLabel htmlFor="takeProfitBps">Take Profit (bps)</FieldLabel>
          <Input id="takeProfitBps" name="takeProfitBps" type="number" placeholder="200" onChange={handleChange} disabled={isLoading} />
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor="description">Analysis / Notes</FieldLabel>
        <Textarea id="description" name="description" placeholder="Describe your trading thesis..." onChange={handleChange} disabled={isLoading} rows={4} />
      </Field>
      <div className="flex items-center gap-2">
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageUpload} className="hidden" id="image-upload" />
        <Button variant="outline" size="sm" onClick={() => document.getElementById('image-upload')?.click()} disabled={isLoading || uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <span className="ml-2">Add Chart</span>
        </Button>
        {imageUrls.map((url) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={url} src={url} alt="Chart preview" className="h-10 w-10 rounded object-cover" />
        ))}
      </div>
      <Button onClick={handleSubmit} disabled={isLoading} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500">
        {isLoading ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Submitting...</span> : 'Submit Plan'}
      </Button>
    </div>
  )
}
