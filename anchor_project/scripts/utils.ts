import { createHash } from 'node:crypto';
import { Program, web3 } from '@coral-xyz/anchor';
import { PlanVault } from '../target/types/plan_vault';

export const ONE_SOL = 100_0000_000; // 1 SOL in lamports

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
		[Buffer.from('vault'), hashedTitle, ownerPublicKey.toBuffer()],
		program.programId,
	);

	return { vaultPda, hashedTitle };
};
