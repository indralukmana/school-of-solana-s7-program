import { Program, web3 } from '@coral-xyz/anchor';
import { getProgram, getVaultDefaultValues, getVaultPda } from './utils';
import { PlanVault } from '../target/types/plan_vault';
import { describe, it, expect, beforeAll } from 'vitest';

describe('vault-initialize', () => {
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

	it('Can be initialized successfully!', async () => {
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

		const storedVault = await program.account.vaultAccount.fetch(vaultPda);

		expect(storedVault.planTitleHash).toEqual(Array.from(hashedTitle));
		expect(storedVault.owner).toEqual(ownerKeypair.publicKey);
		expect(storedVault.status).toEqual({ locked: {} });
		expect(storedVault.tokenVault).toEqual(web3.PublicKey.default);
	});

	it('Can be initialized with a long title', async () => {
		const longTitle = 'a'.repeat(101);
		const { vaultPda, hashedTitle } = getVaultPda({
			ownerKeypair,
			planTitle: longTitle,
			program,
		});

		await program.methods
			.initializeVault(longTitle)
			.accountsPartial({
				owner: ownerKeypair.publicKey,
				vaultAccount: vaultPda,
			})
			.signers([ownerKeypair])
			.rpc();

		const storedVault = await program.account.vaultAccount.fetch(vaultPda);

		expect(storedVault.planTitleHash).toEqual(Array.from(hashedTitle));
		expect(storedVault.owner).toEqual(ownerKeypair.publicKey);
		expect(storedVault.status).toEqual({ locked: {} });
		expect(storedVault.tokenVault).toEqual(web3.PublicKey.default);
	});

	it('Can be initialized with a short title', async () => {
		const shortTitle = 'aaa';
		const { vaultPda, hashedTitle } = getVaultPda({
			ownerKeypair,
			planTitle: shortTitle,
			program,
		});

		await program.methods
			.initializeVault(shortTitle)
			.accountsPartial({
				owner: ownerKeypair.publicKey,
				vaultAccount: vaultPda,
			})
			.signers([ownerKeypair])
			.rpc();

		const storedVault = await program.account.vaultAccount.fetch(vaultPda);

		expect(storedVault.planTitleHash).toEqual(Array.from(hashedTitle));
		expect(storedVault.owner).toEqual(ownerKeypair.publicKey);
		expect(storedVault.status).toEqual({ locked: {} });
		expect(storedVault.tokenVault).toEqual(web3.PublicKey.default);
	});

	it('Cannot be initialized with empty title', async () => {
		const shortTitle = '';
		const { vaultPda, hashedTitle } = getVaultPda({
			ownerKeypair,
			planTitle: shortTitle,
			program,
		});

		await expect(
			program.methods
				.initializeVault(shortTitle)
				.accountsPartial({
					owner: ownerKeypair.publicKey,
					vaultAccount: vaultPda,
				})
				.signers([ownerKeypair])
				.rpc(),
		).rejects.toThrow();
	});

	it('Should fail when the vault is already initialized', async () => {
		const planTitle = 'duplicate-title';
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
				.initializeVault(planTitle)
				.accountsPartial({
					owner: ownerKeypair.publicKey,
					vaultAccount: vaultPda,
				})
				.signers([ownerKeypair])
				.rpc(),
		).rejects.toThrow();
	});

	it('Can be initialized with a 200-character title', async () => {
		const longTitle = 'a'.repeat(200);
		const { vaultPda, hashedTitle } = getVaultPda({
			ownerKeypair,
			planTitle: longTitle,
			program,
		});

		await program.methods
			.initializeVault(longTitle)
			.accountsPartial({
				owner: ownerKeypair.publicKey,
				vaultAccount: vaultPda,
			})
			.signers([ownerKeypair])
			.rpc();

		const storedVault = await program.account.vaultAccount.fetch(vaultPda);

		expect(storedVault.planTitleHash).toEqual(Array.from(hashedTitle));
		expect(storedVault.owner).toEqual(ownerKeypair.publicKey);
		expect(storedVault.status).toEqual({ locked: {} });
		expect(storedVault.tokenVault).toEqual(web3.PublicKey.default);
	});

	it('Cannot be initialized with a title longer than 200 characters', async () => {
		const longTitle = 'a'.repeat(201);
		const { vaultPda } = getVaultPda({
			ownerKeypair,
			planTitle: longTitle,
			program,
		});

		await expect(
			program.methods
				.initializeVault(longTitle)
				.accountsPartial({
					owner: ownerKeypair.publicKey,
					vaultAccount: vaultPda,
				})
				.signers([ownerKeypair])
				.rpc(),
		).rejects.toThrow();
	});

	it('Cannot be initialized with a title shorter than 3 characters', async () => {
		const shortTitle = 'aa';
		const { vaultPda } = getVaultPda({
			ownerKeypair,
			planTitle: shortTitle,
			program,
		});

		await expect(
			program.methods
				.initializeVault(shortTitle)
				.accountsPartial({
					owner: ownerKeypair.publicKey,
					vaultAccount: vaultPda,
				})
				.signers([ownerKeypair])
				.rpc(),
		).rejects.toThrow();
	});
});
