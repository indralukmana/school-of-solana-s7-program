import { Program, web3, BN } from '@coral-xyz/anchor';
import {
	getProgram,
	createAndInitializeVault,
	txSendAndConfirm,
} from './test-helpers';
import { PlanVault } from '../target/types/plan_vault';
import { describe, it, expect, beforeAll } from 'vitest';
import { getDepositTx } from '../scripts/plan-vault-methods';

describe('vault-deposit', () => {
	let program: Program<PlanVault>;
	let ownerKeypair: web3.Keypair;

	beforeAll(async () => {
		const initializedProgram = await getProgram();
		program = initializedProgram.program;
		ownerKeypair = initializedProgram.wallets.ownerKeypair;
	});

	it('Vault can be deposited!', async () => {
		const planTitle = 'deposit-success';
		const { vaultPda, hashedTitle } = await createAndInitializeVault({
			program,
			ownerKeypair,
			planTitle,
		});

		const vaultInitialBalance =
			await program.provider.connection.getBalance(vaultPda);

		const depositAmount = new BN(web3.LAMPORTS_PER_SOL);

		const { tx } = await getDepositTx({
			program,
			ownerPublicKey: ownerKeypair.publicKey,
			vaultPda,
			amount: depositAmount,
		});
		await txSendAndConfirm(program, tx, [ownerKeypair]);

		const storedVaultAfter = await program.account.vaultAccount.fetch(vaultPda);
		const vaultBalance = await program.provider.connection.getBalance(vaultPda);

		expect(storedVaultAfter.planTitleHash).toEqual(Array.from(hashedTitle));
		expect(storedVaultAfter.owner).toEqual(ownerKeypair.publicKey);
		expect(storedVaultAfter.status).toEqual({ locked: {} });
		expect(storedVaultAfter.planTitle).toEqual(planTitle);
		expect(vaultBalance).toEqual(vaultInitialBalance + Number(depositAmount));
	});

	it('Cannot deposit zero', async () => {
		const planTitle = 'deposit-zero';
		const { vaultPda } = await createAndInitializeVault({
			program,
			ownerKeypair,
			planTitle,
		});

		const depositAmount = new BN(0);

		const { tx } = await getDepositTx({
			program,
			ownerPublicKey: ownerKeypair.publicKey,
			vaultPda,
			amount: depositAmount,
		});

		await expect(
			txSendAndConfirm(program, tx, [ownerKeypair]),
		).rejects.toThrow();
	});

	it('Cannot deposit with insufficient funds', async () => {
		const planTitle = 'insufficient-funds';
		const { vaultPda } = await createAndInitializeVault({
			program,
			ownerKeypair,
			planTitle,
		});

		const ownerBalance = await program.provider.connection.getBalance(
			ownerKeypair.publicKey,
		);
		const depositAmount = new BN(ownerBalance + 1);

		const { tx } = await getDepositTx({
			program,
			ownerPublicKey: ownerKeypair.publicKey,
			vaultPda,
			amount: depositAmount,
		});

		await expect(
			txSendAndConfirm(program, tx, [ownerKeypair]),
		).rejects.toThrow();
	});

	it('Another user cannot deposit into the vault', async () => {
		const anotherUser = web3.Keypair.generate();
		const planTitle = 'another-user-deposit';
		const { vaultPda } = await createAndInitializeVault({
			program,
			ownerKeypair,
			planTitle,
		});

		const depositAmount = new BN(web3.LAMPORTS_PER_SOL);

		const { tx } = await getDepositTx({
			program,
			ownerPublicKey: anotherUser.publicKey,
			vaultPda,
			amount: depositAmount,
		});

		await expect(
			txSendAndConfirm(program, tx, [anotherUser]),
		).rejects.toThrow();
	});
});
