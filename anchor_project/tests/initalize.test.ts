import { Program, web3 } from '@coral-xyz/anchor';
import { getProgram, getVaultDefaultValues } from './utils';
import { PlanVault } from '../target/types/plan_vault';

describe('plan-vault', () => {
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

	it('Vault can be  initialized!', async () => {
		const [vaultAccount] = web3.PublicKey.findProgramAddressSync(
			[
				Buffer.from('vault'),
				Buffer.from(planTitle),
				ownerKeypair.publicKey.toBuffer(),
			],
			program.programId,
		);

		await program.methods
			.initializeVault(planTitle)
			.accountsPartial({
				owner: ownerKeypair.publicKey,
				vaultAccount,
			})
			.signers([ownerKeypair])
			.rpc();

		const storedVault = await program.account.vaultAccount.fetch(vaultAccount);
		console.log({ storedVault });

		expect(storedVault.planTitle).toEqual(planTitle);
		expect(storedVault.owner).toEqual(ownerKeypair.publicKey);
		expect(storedVault.status).toEqual({ locked: {} });
		expect(storedVault.tokenVault).toEqual(web3.PublicKey.default);
	});
});
