import { Program, web3, BN } from '@coral-xyz/anchor';
import {
	getProgram,
	createAndInitializeVault,
	getDefaultPlanArgs,
	txSendAndConfirm,
} from './test-helpers';
import { PlanVault } from '../target/types/plan_vault';
import { describe, it, expect, beforeAll } from 'vitest';
import {
	getDepositTx,
	getSubmitPlanTx,
	getWithdrawTx,
} from '../scripts/plan-vault-methods';

describe('withdraw', () => {
	let program: Program<PlanVault>;
	let ownerKeypair: web3.Keypair;

	beforeAll(async () => {
		const initalizedProgram = await getProgram();
		program = initalizedProgram.program;
		ownerKeypair = initalizedProgram.wallets.ownerKeypair;
	});

	it('Can withdraw from a vault successfully', async () => {
		const planTitle = 'successful-withdraw';
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
		await txSendAndConfirm(program, depositTx, [ownerKeypair]);

		const args = getDefaultPlanArgs();
		const { tx: submitTx } = await getSubmitPlanTx({
			program,
			ownerPublicKey: ownerKeypair.publicKey,
			vaultPda,
			args,
		});
		await txSendAndConfirm(program, submitTx, [ownerKeypair]);

		const ownerBalanceBefore = await program.provider.connection.getBalance(
			ownerKeypair.publicKey,
		);
		const vaultBalanceBefore =
			await program.provider.connection.getBalance(vaultPda);

		const { tx: withdrawTx } = await getWithdrawTx({
			program,
			ownerPublicKey: ownerKeypair.publicKey,
			vaultPda,
		});
		await txSendAndConfirm(program, withdrawTx, [ownerKeypair]);

		const ownerBalanceAfter = await program.provider.connection.getBalance(
			ownerKeypair.publicKey,
		);
		const vaultBalanceAfter =
			await program.provider.connection.getBalance(vaultPda);

		const vaultAccountInfo =
			await program.provider.connection.getAccountInfo(vaultPda);

		const vaultDataLength = vaultAccountInfo?.data?.length;
		if (!vaultDataLength) {
			throw new Error('Cannot get data length');
		}

		const rentExempt =
			await program.provider.connection.getMinimumBalanceForRentExemption(
				vaultDataLength,
			);

		expect(vaultBalanceAfter).to.equal(rentExempt);
		expect(ownerBalanceAfter > ownerBalanceBefore).to.be.true;
		expect(vaultBalanceAfter).to.lessThan(vaultBalanceBefore);
	});

	it('Should fail to withdraw from a locked vault', async () => {
		const planTitle = 'locked-withdraw';
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
		await txSendAndConfirm(program, depositTx, [ownerKeypair]);

		const { tx: withdrawTx } = await getWithdrawTx({
			program,
			ownerPublicKey: ownerKeypair.publicKey,
			vaultPda,
		});

		await expect(
			txSendAndConfirm(program, withdrawTx, [ownerKeypair]),
		).rejects.toThrow();
	});

	it('Should fail to withdraw by a different user', async () => {
		const planTitle = 'different-user-withdraw';
		const anotherUser = web3.Keypair.generate();
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
		await txSendAndConfirm(program, depositTx, [ownerKeypair]);

		const args = getDefaultPlanArgs();
		const { tx: submitTx } = await getSubmitPlanTx({
			program,
			ownerPublicKey: ownerKeypair.publicKey,
			vaultPda,
			args,
		});
		await txSendAndConfirm(program, submitTx, [ownerKeypair]);

		const { tx: withdrawTx } = await getWithdrawTx({
			program,
			ownerPublicKey: anotherUser.publicKey,
			vaultPda,
		});

		await expect(
			txSendAndConfirm(program, withdrawTx, [anotherUser]),
		).rejects.toThrow();
	});
});
