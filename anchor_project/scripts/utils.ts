import { createHash } from 'node:crypto';
import { Program, web3 } from '@coral-xyz/anchor';
import { PlanVault } from '../target/types/plan_vault';

export const ONE_SOL = 100_0000_000; // 1 SOL in lamports
export const VAULT_SEED = 'vault';
export const PLAN_SEED = 'plan';

export const hashTitle = ({ planTitle }: { planTitle: string }) => {
	return createHash('sha256').update(planTitle, 'utf8').digest();
};

export const getVaultPda = ({
	planTitle,
	ownerPublicKey,
	program,
}: {
	planTitle: string;
	ownerPublicKey: web3.PublicKey;
	program: Program<PlanVault>;
}) => {
	const hashedTitle = hashTitle({ planTitle });
	const [vaultPda] = web3.PublicKey.findProgramAddressSync(
		[Buffer.from(VAULT_SEED), hashedTitle, ownerPublicKey.toBuffer()],
		program.programId,
	);

	return { vaultPda, hashedTitle };
};

export const getPlanPda = ({
	vaultPublicKey,
	program,
}: {
	vaultPublicKey: web3.PublicKey;
	program: Program<PlanVault>;
}) => {
	const [planPda] = web3.PublicKey.findProgramAddressSync(
		[Buffer.from(PLAN_SEED), vaultPublicKey.toBuffer()],
		program.programId,
	);

	return { planPda };
};
