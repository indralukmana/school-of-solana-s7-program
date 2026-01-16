import { createHash } from 'crypto'
import {
  AnchorProvider,
  Program,
  setProvider,
  web3,
  workspace,
} from "@coral-xyz/anchor";
import { PlanVault } from "../target/types/plan_vault";
import { getInitializeVaultTx, ONE_SOL } from "../scripts/plan-vault-methods";

export const txSendAndConfirm = async (
  program: Program<PlanVault>,
  tx: web3.Transaction,
  signers: web3.Keypair[],
) => {
  try {
    return await program.provider.sendAndConfirm?.(tx, signers);
  } catch (e: any) {
    const logs = e.logs as string[] | undefined;
    if (logs) {
      const match = logs.join("\n").match(/Error Code: (Constraint\w+)/);
      if (match) {
        throw new Error(`Anchor Error: ${match[1]}`);
      }
    }
    throw e;
  }
};

export const getVaultDefaultValues = () => {
  // vault default values
  const planTitle = "Initial Example Plan";

  return { planTitle };
};

export const getDefaultPlanArgs = (): { contentHash: number[]; contentUri: string } => {
  const planContent = JSON.stringify({
    tradingPlatform: 'Jupiter',
    riskLevel: 'High',
    ticker: 'SOL',
    investmentLamports: ONE_SOL,
    stopLossBps: 500,
    takeProfitBps: 1000,
  })
  const hash = createHash('sha256').update(planContent).digest()
  return {
    contentHash: Array.from(hash),
    contentUri: 'https://api.planvault.xyz/plans/' + hash.toString('hex'),
  }
}

export const getProgram = async () => {
  // Configure the client to use the local cluster.
  const provider = AnchorProvider.env();
  setProvider(provider);

  const program = workspace.plan_vault as Program<PlanVault>;

  const ownerKeypair = web3.Keypair.generate();

  // Request airdrop
  const signature = await provider.connection.requestAirdrop(
    ownerKeypair.publicKey,
    ONE_SOL * 10,
  );

  const { blockhash, lastValidBlockHeight } =
    await provider.connection.getLatestBlockhash();

  await provider.connection.confirmTransaction(
    { blockhash, lastValidBlockHeight, signature },
    "confirmed",
  );

  const wallets = { ownerKeypair };

  return { program, provider, wallets };
};

export const createAndInitializeVault = async ({
  program,
  ownerKeypair,
  planTitle,
}: {
  program: Program<PlanVault>;
  ownerKeypair: web3.Keypair;
  planTitle: string;
}) => {
  const { tx, vaultPda, planPda, hashedTitle } = await getInitializeVaultTx({
    program,
    ownerPublicKey: ownerKeypair.publicKey,
    planTitle,
  });

  await txSendAndConfirm(program, tx, [ownerKeypair]);

  return { vaultPda, planPda, hashedTitle };
};
