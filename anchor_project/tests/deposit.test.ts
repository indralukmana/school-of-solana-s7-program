import { Program, web3, BN } from '@coral-xyz/anchor';
import { getProgram, getVaultDefaultValues, getVaultPda } from './utils';
import { PlanVault } from '../target/types/plan_vault';
import { describe, it, expect, beforeAll } from 'vitest';

describe('vault-deposit', () => {
	// Configure the client to use the local cluster.

	let program: Program<PlanVault>;
	let ownerKeypair: web3.Keypair;
	const defaultVaultValues = getVaultDefaultValues();
	const { planTitle } = defaultVaultValues;

	beforeAll(async () => {
		const initalizedProgram = await getProgram();
		program = initalizedProgram.program;
		ownerKeypair = initalizedProgram.wallets.ownerKeypair;
	});

	it('Vault can be deposited!', async () => {
		const { vaultPda, hashedTitle } = getVaultPda({
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

		const vaultInitialBalance =
			await program.provider.connection.getBalance(vaultPda);

		const depositAmount = new BN(web3.LAMPORTS_PER_SOL);

		await program.methods
			.deposit(depositAmount)
			.accountsPartial({
				owner: ownerKeypair.publicKey,
				vaultAccount: vaultPda,
			})
			.signers([ownerKeypair])
			.rpc();

		const storedVaultAfter = await program.account.vaultAccount.fetch(vaultPda);
		const vaultBalance = await program.provider.connection.getBalance(vaultPda);

		expect(storedVaultAfter.planTitleHash).toEqual(Array.from(hashedTitle));
		expect(storedVaultAfter.owner).toEqual(ownerKeypair.publicKey);
		expect(storedVaultAfter.status).toEqual({ locked: {} });
		expect(vaultBalance).toEqual(vaultInitialBalance + Number(depositAmount));
	});

	it('Cannot deposit zero', async () => {
		const { vaultPda } = getVaultPda({
			ownerKeypair,
			planTitle: 'deposit-zero',
			program,
		});

		await program.methods
			.initializeVault('deposit-zero')
			.accountsPartial({
				owner: ownerKeypair.publicKey,
				vaultAccount: vaultPda,
			})
			.signers([ownerKeypair])
			.rpc();

		const depositAmount = new BN(0);

		await expect(
			program.methods
				.deposit(depositAmount)
				.accountsPartial({
					owner: ownerKeypair.publicKey,
					vaultAccount: vaultPda,
				})
				.signers([ownerKeypair])
				.rpc(),
		).rejects.toThrow();
	});

	it('Cannot deposit with insufficient funds', async () => {
		const { vaultPda } = getVaultPda({
			ownerKeypair,
			planTitle: 'insufficient-funds',
			program,
		});

		await program.methods
			.initializeVault('insufficient-funds')
			.accountsPartial({
				owner: ownerKeypair.publicKey,
				vaultAccount: vaultPda,
			})
			.signers([ownerKeypair])
			.rpc();

		const ownerBalance = await program.provider.connection.getBalance(
			ownerKeypair.publicKey,
		);
		const depositAmount = new BN(ownerBalance + 1);

		await expect(
			program.methods
				.deposit(depositAmount)
				.accountsPartial({
					owner: ownerKeypair.publicKey,
					vaultAccount: vaultPda,
				})
				.signers([ownerKeypair])
				.rpc(),
		).rejects.toThrow();
	});

	it('Another user cannot deposit into the vault', async () => {
		const anotherUser = web3.Keypair.generate();
		const { vaultPda } = getVaultPda({
			ownerKeypair,
			planTitle: 'another-user-deposit',
			program,
		});

		await program.methods
			.initializeVault('another-user-deposit')
			.accountsPartial({
				owner: ownerKeypair.publicKey,
				vaultAccount: vaultPda,
			})
			.signers([ownerKeypair])
			.rpc();

		const depositAmount = new BN(web3.LAMPORTS_PER_SOL);

		await expect(
			program.methods
				.deposit(depositAmount)
				.accountsPartial({
					owner: anotherUser.publicKey,
					vaultAccount: vaultPda,
				})
				.signers([anotherUser])
				.rpc(),
		).rejects.toThrow();
	});
});
