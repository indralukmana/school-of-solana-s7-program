import { Program, web3, BN } from '@coral-xyz/anchor';
import { getProgram, createAndInitializeVault } from './test-helpers';
import { PlanVault } from '../target/types/plan_vault';
import { describe, it, expect, beforeAll } from 'vitest';
import { getDepositTx, getSubmitPlanTx } from '../scripts/methods';

describe('submit-plan', () => {
	let program: Program<PlanVault>;
	let ownerKeypair: web3.Keypair;

	beforeAll(async () => {
		const initalizedProgram = await getProgram();
		program = initalizedProgram.program;
		ownerKeypair = initalizedProgram.wallets.ownerKeypair;
	});

	it('Can submit a plan successfully', async () => {
		const planTitle = 'successful-submit';
		const { vaultPda } = await createAndInitializeVault({
			program,
			ownerKeypair,
			planTitle,
		});

		const depositAmount = new BN(web3.LAMPORTS_PER_SOL);
		const { tx: depositTx } = await getDepositTx({
			program,
			ownerPublicKey: ownerKeypair.publicKey,
			vaultPda,
			amount: depositAmount,
		});
		await program.provider.sendAndConfirm?.(depositTx, [ownerKeypair]);

		const { tx: submitTx } = await getSubmitPlanTx({
			program,
			ownerPublicKey: ownerKeypair.publicKey,
			vaultPda,
		});
		await program.provider.sendAndConfirm?.(submitTx, [ownerKeypair]);

		const storedVault = await program.account.vaultAccount.fetch(vaultPda);
		expect(storedVault.status).toEqual({ unlocked: {} });
	});

	it('Should fail to submit a plan with insufficient funds', async () => {
		const planTitle = 'insufficient-funds-submit';
		const { vaultPda } = await createAndInitializeVault({
			program,
			ownerKeypair,
			planTitle,
		});

		const { tx } = await getSubmitPlanTx({
			program,
			ownerPublicKey: ownerKeypair.publicKey,
			vaultPda,
		});

		await expect(
			program.provider.sendAndConfirm?.(tx, [ownerKeypair]),
		).rejects.toThrow();
	});

	it('Should fail to submit a plan by a different user', async () => {
		const planTitle = 'different-user-submit';
		const anotherUser = web3.Keypair.generate();
		const { vaultPda } = await createAndInitializeVault({
			program,
			ownerKeypair,
			planTitle,
		});

		const { tx } = await getSubmitPlanTx({
			program,
			ownerPublicKey: anotherUser.publicKey,
			vaultPda,
		});

		await expect(
			program.provider.sendAndConfirm?.(tx, [anotherUser]),
		).rejects.toThrow();
	});
});
