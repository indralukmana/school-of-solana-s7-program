import {
	AnchorProvider,
	Program,
	setProvider,
	web3,
	workspace,
} from '@coral-xyz/anchor';
import { PlanVault } from '../target/types/plan_vault';

export const ONE_SOL = 100_0000_000; // 1 SOL in lamports

export const getVaultDefaultValues = () => {
	// vault default values
	const planTitle = 'Initial Example Plan';

	return { planTitle };
};

export const getProgram = async () => {
	// Configure the client to use the local cluster.
	const provider = AnchorProvider.env();
	setProvider(provider);

	const program = workspace.plan_vault as Program<PlanVault>;

	const ownerKeypair = web3.Keypair.generate();

	// Request airdrop
	const signature = await provider.connection.requestAirdrop(
		ownerKeypair.publicKey,
		ONE_SOL * 10,
	);

	const { blockhash, lastValidBlockHeight } =
		await provider.connection.getLatestBlockhash();

	await provider.connection.confirmTransaction(
		{ blockhash, lastValidBlockHeight, signature },
		'confirmed',
	);

	const wallets = { ownerKeypair };

	return { program, provider, wallets };
};
