import { Program, web3 } from '@coral-xyz/anchor';
import {
	getProgram,
	getVaultDefaultValues,
	createAndInitializeVault,
} from './test-helpers';
import { PlanVault } from '../target/types/plan_vault';
import { describe, it, expect, beforeAll } from 'vitest';

describe('vault-initialize', () => {
	let program: Program<PlanVault>;
	let ownerKeypair: web3.Keypair;
	const { planTitle } = getVaultDefaultValues();

	beforeAll(async () => {
		const initalizedProgram = await getProgram();
		program = initalizedProgram.program;
		ownerKeypair = initalizedProgram.wallets.ownerKeypair;
	});

	it('Can be initialized successfully!', async () => {
		const { vaultPda, hashedTitle } = await createAndInitializeVault({
			program,
			ownerKeypair,
			planTitle,
		});

		const storedVault = await program.account.vaultAccount.fetch(vaultPda);

		expect(storedVault.planTitleHash).toEqual(Array.from(hashedTitle));
		expect(storedVault.owner).toEqual(ownerKeypair.publicKey);
		expect(storedVault.status).toEqual({ locked: {} });
		expect(storedVault.tokenVault).toEqual(web3.PublicKey.default);
	});

	it('Can be initialized with a long title', async () => {
		const longTitle = 'a'.repeat(101);
		const { vaultPda, hashedTitle } = await createAndInitializeVault({
			program,
			ownerKeypair,
			planTitle: longTitle,
		});

		const storedVault = await program.account.vaultAccount.fetch(vaultPda);

		expect(storedVault.planTitleHash).toEqual(Array.from(hashedTitle));
	});

	it('Can be initialized with a short title', async () => {
		const shortTitle = 'aaa';
		const { vaultPda, hashedTitle } = await createAndInitializeVault({
			program,
			ownerKeypair,
			planTitle: shortTitle,
		});

		const storedVault = await program.account.vaultAccount.fetch(vaultPda);

		expect(storedVault.planTitleHash).toEqual(Array.from(hashedTitle));
	});

	it('Cannot be initialized with empty title', async () => {
		const shortTitle = '';
		await expect(
			createAndInitializeVault({
				program,
				ownerKeypair,
				planTitle: shortTitle,
			}),
		).rejects.toThrow();
	});

	it('Should fail when the vault is already initialized', async () => {
		const planTitle = 'duplicate-title';
		await createAndInitializeVault({
			program,
			ownerKeypair,
			planTitle,
		});

		await expect(
			createAndInitializeVault({
				program,
				ownerKeypair,
				planTitle,
			}),
		).rejects.toThrow();
	});

	it('Can be initialized with a 200-character title', async () => {
		const longTitle = 'a'.repeat(200);
		const { vaultPda, hashedTitle } = await createAndInitializeVault({
			program,
			ownerKeypair,
			planTitle: longTitle,
		});

		const storedVault = await program.account.vaultAccount.fetch(vaultPda);

		expect(storedVault.planTitleHash).toEqual(Array.from(hashedTitle));
	});

	it('Cannot be initialized with a title longer than 200 characters', async () => {
		const longTitle = 'a'.repeat(201);
		await expect(
			createAndInitializeVault({
				program,
				ownerKeypair,
				planTitle: longTitle,
			}),
		).rejects.toThrow();
	});

	it('Cannot be initialized with a title shorter than 3 characters', async () => {
		const shortTitle = 'aa';
		await expect(
			createAndInitializeVault({
				program,
				ownerKeypair,
				planTitle: shortTitle,
			}),
		).rejects.toThrow();
	});
});
