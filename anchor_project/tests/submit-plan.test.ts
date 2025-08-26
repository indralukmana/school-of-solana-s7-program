import { Program, web3, BN } from '@coral-xyz/anchor';
import { getProgram, getVaultPda } from './utils';
import { PlanVault } from '../target/types/plan_vault';
import { describe, it, expect, beforeAll } from 'vitest';

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
		const { vaultPda } = getVaultPda({
			ownerKeypair,
			planTitle,
			program,
		});

		await program.methods
			.initializeVault(planTitle)
			.accountsPartial({
				owner: ownerKeypair.publicKey,
				vaultAccount: vaultPda,
			})
			.signers([ownerKeypair])
			.rpc();

		const depositAmount = new BN(web3.LAMPORTS_PER_SOL);
		await program.methods
			.deposit(depositAmount)
			.accountsPartial({
				owner: ownerKeypair.publicKey,
				vaultAccount: vaultPda,
			})
			.signers([ownerKeypair])
			.rpc();

		await program.methods
			.submitPlan()
			.accountsPartial({
				owner: ownerKeypair.publicKey,
				vaultAccount: vaultPda,
			})
			.signers([ownerKeypair])
			.rpc();

		const storedVault = await program.account.vaultAccount.fetch(vaultPda);
		expect(storedVault.status).toEqual({ unlocked: {} });
	});

	it('Should fail to submit a plan with insufficient funds', async () => {
		const planTitle = 'insufficient-funds-submit';
		const { vaultPda } = getVaultPda({
			ownerKeypair,
			planTitle,
			program,
		});

		await program.methods
			.initializeVault(planTitle)
			.accountsPartial({
				owner: ownerKeypair.publicKey,
				vaultAccount: vaultPda,
			})
			.signers([ownerKeypair])
			.rpc();

		await expect(
			program.methods
				.submitPlan()
				.accountsPartial({
					owner: ownerKeypair.publicKey,
					vaultAccount: vaultPda,
				})
				.signers([ownerKeypair])
				.rpc(),
		).rejects.toThrow();
	});

	it('Should fail to submit a plan by a different user', async () => {
		const planTitle = 'different-user-submit';
		const anotherUser = web3.Keypair.generate();
		const { vaultPda } = getVaultPda({
			ownerKeypair,
			planTitle,
			program,
		});

		await program.methods
			.initializeVault(planTitle)
			.accountsPartial({
				owner: ownerKeypair.publicKey,
				vaultAccount: vaultPda,
			})
			.signers([ownerKeypair])
			.rpc();

		await expect(
			program.methods
				.submitPlan()
				.accountsPartial({
					owner: anotherUser.publicKey,
					vaultAccount: vaultPda,
				})
				.signers([anotherUser])
				.rpc(),
		).rejects.toThrow();
	});
});
