'use client'

import { Check, Lock, ArrowDown, Wallet } from 'lucide-react'

interface VaultProgressProps {
  currentStep: number
}

export function VaultProgress({ currentStep }: VaultProgressProps) {
  const steps = [
    {
      label: 'Create Vault',
      description: 'Name your trading plan',
      icon: <Check className="h-5 w-5" />,
      status: 'completed' as const,
    },
    {
      label: 'Deposit SOL',
      description: 'Fund your commitment',
      icon: <ArrowDown className="h-5 w-5" />,
      status: (currentStep >= 2 ? 'completed' : currentStep === 1 ? 'active' : 'pending') as
        | 'completed'
        | 'active'
        | 'pending',
    },
    {
      label: 'Submit Plan',
      description: 'Detail your trade strategy',
      icon: <Lock className="h-5 w-5" />,
      status: (currentStep >= 3 ? 'completed' : currentStep === 2 ? 'active' : 'pending') as
        | 'completed'
        | 'active'
        | 'pending',
    },
    {
      label: 'Withdraw',
      description: 'Execute your trade',
      icon: <Wallet className="h-5 w-5" />,
      status: (currentStep >= 4 ? 'completed' : currentStep === 3 ? 'active' : 'pending') as
        | 'completed'
        | 'active'
        | 'pending',
    },
  ]

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-bold mb-4">Progress</h3>
      <div className="space-y-0">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1
          const isCompleted = step.status === 'completed'
          const isActive = step.status === 'active'

          return (
            <div key={step.label} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                    isCompleted
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : isActive
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                        : 'bg-white/[0.04] border-white/[0.08] text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : step.icon}
                </div>
                {!isLast && (
                  <div className={`w-0.5 h-8 mt-1 ${isCompleted ? 'bg-emerald-500/30' : 'bg-white/[0.06]'}`} />
                )}
              </div>
              <div className="pb-4">
                <p
                  className={`text-sm font-medium ${
                    isActive ? 'text-blue-400' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
