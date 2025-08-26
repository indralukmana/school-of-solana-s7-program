import { Program, web3, BN } from '@coral-xyz/anchor';
import { PlanVault } from '../target/types/plan_vault';
import { getPlanPda, getVaultPda } from './utils';

export const getInitializeVaultTx = async ({
	program,
	planTitle,
	ownerPublicKey,
}: {
	program: Program<PlanVault>;
	planTitle: string;
	ownerPublicKey: web3.PublicKey;
}) => {
	const { vaultPda, hashedTitle } = getVaultPda({
		ownerPublicKey,
		planTitle,
		program,
	});

	const tx = await program.methods
		.initializeVault(planTitle)
		.accountsPartial({
			owner: ownerPublicKey,
			vaultAccount: vaultPda,
		})
		.transaction();

	return { tx, vaultPda, hashedTitle };
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
