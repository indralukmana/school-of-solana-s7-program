import { Program, web3, BN } from '@coral-xyz/anchor';
import type { PlanVault } from '../target/types/plan_vault';

export const ONE_SOL = 100_0000_000; // 1 SOL in lamports
export const VAULT_SEED = 'vault';
export const PLAN_SEED = 'plan';

export const sha256Bytes = async (input: string): Promise<Uint8Array> => {
	const enc = new TextEncoder();
	const data = enc.encode(input);
	const digest = await crypto.subtle.digest('SHA-256', data);
	return new Uint8Array(digest);
};

export const getVaultPda = async ({
	planTitle,
	ownerPublicKey,
	program,
}: {
	planTitle: string;
	ownerPublicKey: web3.PublicKey;
	program: Program<PlanVault>;
}) => {
	const hashedTitle = await sha256Bytes(planTitle);
	const [vaultPda, vaultBump] = web3.PublicKey.findProgramAddressSync(
		[
			Buffer.from(VAULT_SEED),
			Buffer.from(hashedTitle),
			ownerPublicKey.toBuffer(),
		],
		program.programId,
	);
	return { vaultPda, vaultBump, hashedTitle: Buffer.from(hashedTitle) };
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

export const getInitializeVaultTx = async ({
	program,
	planTitle,
	ownerPublicKey,
}: {
	program: Program<PlanVault>;
	planTitle: string;
	ownerPublicKey: web3.PublicKey;
}) => {
	const { vaultPda, hashedTitle } = await getVaultPda({
		ownerPublicKey,
		planTitle,
		program,
	});

	const { planPda } = getPlanPda({
		vaultPublicKey: vaultPda,
		program,
	});

	const tx = await program.methods
		.initializeVault(planTitle)
		.accountsPartial({
			owner: ownerPublicKey,
			vaultAccount: vaultPda,
			plan: planPda,
		})
		.transaction();

	return { tx, vaultPda, planPda, hashedTitle };
};

export const getDepositTx = async ({
	program,
	ownerPublicKey,
	vaultPda,
	amount,
}: {
	program: Program<PlanVault>;
	ownerPublicKey: web3.PublicKey;
	vaultPda: web3.PublicKey;
	amount: BN;
}) => {
	const tx = await program.methods
		.deposit(amount)
		.accountsPartial({
			owner: ownerPublicKey,
			vaultAccount: vaultPda,
		})
		.transaction();
	return { tx };
};

export const getSubmitPlanTx = async ({
	program,
	ownerPublicKey,
	vaultPda,
	args,
}: {
	program: Program<PlanVault>;
	ownerPublicKey: web3.PublicKey;
	vaultPda: web3.PublicKey;
	args: any;
}) => {
	const { planPda } = getPlanPda({
		vaultPublicKey: vaultPda,
		program,
	});

	const tx = await program.methods
		.submitPlan(args)
		.accountsPartial({
			owner: ownerPublicKey,
			vaultAccount: vaultPda,
			plan: planPda,
		})
		.transaction();
	return { tx, planPda };
};

export const getWithdrawTx = async ({
	program,
	ownerPublicKey,
	vaultPda,
}: {
	program: Program<PlanVault>;
	ownerPublicKey: web3.PublicKey;
	vaultPda: web3.PublicKey;
}) => {
	const tx = await program.methods
		.withdraw()
		.accountsPartial({
			owner: ownerPublicKey,
			vaultAccount: vaultPda,
		})
		.transaction();
	return { tx };
};

export const getCloseVaultTx = async ({
	program,
	ownerPublicKey,
	vaultPda,
	planPda,
}: {
	program: Program<PlanVault>;
	ownerPublicKey: web3.PublicKey;
	vaultPda: web3.PublicKey;
	planPda: web3.PublicKey;
}) => {
	const tx = await program.methods
		.closeVault()
		.accountsPartial({
			owner: ownerPublicKey,
			vaultAccount: vaultPda,
			plan: planPda,
		})
		.transaction();
	return { tx };
};
