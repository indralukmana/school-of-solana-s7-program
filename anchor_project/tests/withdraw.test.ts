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
  getWithdrawTx,
} from "../scripts/plan-vault-methods";

describe("withdraw", () => {
  let program: Program<PlanVault>;
  let ownerKeypair: web3.Keypair;

  beforeAll(async () => {
    const initializedProgram = await getProgram();
    program = initializedProgram.program;
    ownerKeypair = initializedProgram.wallets.ownerKeypair;
  });

  it("Should fail to withdraw after plan submission (vault stays locked)", async () => {
    const planTitle = "no-withdraw-after-submit";
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
      ownerPublicKey: ownerKeypair.publicKey,
      vaultPda,
    });

    await expect(
      txSendAndConfirm(program, withdrawTx, [ownerKeypair]),
    ).rejects.toThrow(/Vault is locked/);
  });

  it("Should fail to withdraw from a locked vault", async () => {
    const planTitle = "locked-withdraw";
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
    ).rejects.toThrow(/Vault is locked/);
  });

  it("Should fail to withdraw by a different user", async () => {
    const planTitle = "different-user-withdraw";
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

    const errPattern = /Vault is locked|ConstraintHasOne/;
    await expect(
      txSendAndConfirm(program, withdrawTx, [anotherUser]),
    ).rejects.toThrow(errPattern);
  });
});
