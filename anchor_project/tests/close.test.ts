import { Program, web3, BN } from "@coral-xyz/anchor";
import {
  getProgram,
  createAndInitializeVault,
  getDefaultPlanArgs,
  txSendAndConfirm,
} from "./test-helpers";
import { PlanVault } from "../target/types/plan_vault";
import { describe, it, expect, beforeAll } from "vitest";
import {
  getDepositTx,
  getSubmitPlanTx,
  getCloseVaultTx,
} from "../scripts/plan-vault-methods";

describe("close-vault", () => {
  let program: Program<PlanVault>;
  let ownerKeypair: web3.Keypair;

  beforeAll(async () => {
    const initializedProgram = await getProgram();
    program = initializedProgram.program;
    ownerKeypair = initializedProgram.wallets.ownerKeypair;
  });

  it("Can close a vault after submitting a plan", async () => {
    // 1. Create vault and plan
    const planTitle = "successful-close-after-submit";
    const { vaultPda, planPda } = await createAndInitializeVault({
      program,
      ownerKeypair,
      planTitle,
    });

    // 2. Deposit and Submit plan
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

    // 3. Close vault
    const { tx: closeTx } = await getCloseVaultTx({
      program,
      ownerPublicKey: ownerKeypair.publicKey,
      vaultPda,
      planPda,
    });
    await txSendAndConfirm(program, closeTx, [ownerKeypair]);

    // 4. Check accounts are closed
    const vaultAccountAfter =
      await program.provider.connection.getAccountInfo(vaultPda);
    expect(vaultAccountAfter).toBeNull();
    const planAccountAfter =
      await program.provider.connection.getAccountInfo(planPda);
    expect(planAccountAfter).toBeNull();
  });

  it("Can close a vault after depositing without submitting a plan", async () => {
    const planTitle = "successful-close-after-deposit";
    const { vaultPda, planPda } = await createAndInitializeVault({
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

    const { tx: closeTx } = await getCloseVaultTx({
      program,
      ownerPublicKey: ownerKeypair.publicKey,
      vaultPda,
      planPda,
    });
    await txSendAndConfirm(program, closeTx, [ownerKeypair]);

    const vaultAccountAfter =
      await program.provider.connection.getAccountInfo(vaultPda);
    expect(vaultAccountAfter).toBeNull();
    const planAccountAfter =
      await program.provider.connection.getAccountInfo(planPda);
    expect(planAccountAfter).toBeNull();
  });

  it("Can close a vault before submitting a plan", async () => {
    // 1. Create vault and empty plan
    const planTitle = "successful-close-before-submit";
    const { vaultPda, planPda } = await createAndInitializeVault({
      program,
      ownerKeypair,
      planTitle,
    });

    // 2. Close vault
    const { tx: closeTx } = await getCloseVaultTx({
      program,
      ownerPublicKey: ownerKeypair.publicKey,
      vaultPda,
      planPda,
    });
    await txSendAndConfirm(program, closeTx, [ownerKeypair]);

    // 3. Check accounts are closed
    const vaultAccountAfter =
      await program.provider.connection.getAccountInfo(vaultPda);
    expect(vaultAccountAfter).toBeNull();
    const planAccountAfter =
      await program.provider.connection.getAccountInfo(planPda);
    expect(planAccountAfter).toBeNull();
  });

  it("Should fail to close a vault by a different user", async () => {
    // 1. Create vault and plan
    const planTitle = "different-user-close";
    const { vaultPda, planPda } = await createAndInitializeVault({
      program,
      ownerKeypair,
      planTitle,
    });

    // 2. Try to close with another user
    const anotherUser = web3.Keypair.generate();
    const { tx: closeTx } = await getCloseVaultTx({
      program,
      ownerPublicKey: anotherUser.publicKey,
      vaultPda,
      planPda,
    });

    await expect(
      txSendAndConfirm(program, closeTx, [anotherUser]),
    ).rejects.toThrow(/ConstraintHasOne/);
  });

  it("Should fail to close a vault with a plan from a different vault", async () => {
    // 1. Create vault A
    const vaultATitle = "vault-a-close-with-plan-b";
    const { vaultPda: vaultAPda } = await createAndInitializeVault({
      program,
      ownerKeypair,
      planTitle: vaultATitle,
    });

    // 2. Create vault B
    const vaultBTitle = "vault-b-for-plan-b";
    const { planPda: planBPda } = await createAndInitializeVault({
      program,
      ownerKeypair,
      planTitle: vaultBTitle,
    });

    // 3. Attempt to close vault A with plan B
    const { tx: closeTx } = await getCloseVaultTx({
      program,
      ownerPublicKey: ownerKeypair.publicKey,
      vaultPda: vaultAPda,
      planPda: planBPda,
    });

    // This should fail due to the has_one constraint
    await expect(
      txSendAndConfirm(program, closeTx, [ownerKeypair]),
    ).rejects.toThrow(/ConstraintHasOne/);
  });
});
