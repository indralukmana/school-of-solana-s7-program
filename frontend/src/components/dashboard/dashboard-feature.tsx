'use client'

import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { AppHero } from '../app-hero';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useInitializeVault } from '@/hooks/use-initialize-vault';

export function DashboardFeature() {
  const { publicKey } = useWallet();
  const [planTitle, setPlanTitle] = useState('');
  const initializeVault = useInitializeVault();

  const handleCreate = () => {
    if (!planTitle) return;
    initializeVault.mutate(planTitle, {
      onSuccess: () => setPlanTitle(''),
    });
  };

  return (
    <div>
      <AppHero
        title="PlanVault"
        subtitle="Create a vault, deposit SOL, submit a trading plan, and withdraw your funds."
      />
      <div className="max-w-xl mx-auto py-6 sm:px-6 lg:px-8">
        {publicKey ? (
          <div className="flex flex-col items-center space-y-4">
            <h2 className="text-2xl font-bold">Create a New Vault</h2>
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                type="text"
                placeholder="Enter Plan Title"
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
                minLength={3}
                maxLength={200}
              />
              <Button
                disabled={!planTitle || initializeVault.isPending}
                onClick={handleCreate}
              >
                {initializeVault.isPending ? 'Creating...' : 'Create Vault'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p>Please connect your wallet to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}

