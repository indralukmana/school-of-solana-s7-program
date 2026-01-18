import { Program, web3, BN } from "@coral-xyz/anchor";
import {
  getProgram,
  createAndInitializeVault,
  getDefaultPlanArgs,
  txSendAndConfirm,
} from "./test-helpers";
import { PlanVault } from "../target/types/plan_vault";
import { describe, it, expect, beforeAll } from "vitest";
import { getDepositTx, getSubmitPlanTx } from "../scripts/plan-vault-methods";

describe("submit-plan", () => {
  let program: Program<PlanVault>;
  let ownerKeypair: web3.Keypair;

  beforeAll(async () => {
    const initializedProgram = await getProgram();
    program = initializedProgram.program;
    ownerKeypair = initializedProgram.wallets.ownerKeypair;
  });

  it("Can submit a plan successfully", async () => {
    const planTitle = "successful-submit";
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
    const { tx: submitTx, planPda } = await getSubmitPlanTx({
      program,
      ownerPublicKey: ownerKeypair.publicKey,
      vaultPda,
      args,
    });
    await txSendAndConfirm(program, submitTx, [ownerKeypair]);

    const storedVault = await program.account.vaultAccount.fetch(vaultPda);
    expect(storedVault.status).toEqual({ unlocked: {} });

    const storedPlan = await program.account.plan.fetch(planPda);
    expect(storedPlan.contentHash).toEqual(args.contentHash);
    expect(storedPlan.contentUri).toEqual(args.contentUri);
    expect(storedPlan.vaultAccount.toBase58()).toEqual(vaultPda.toBase58());
  });

  it("Should fail to submit a plan with insufficient funds", async () => {
    const planTitle = "insufficient-funds-submit";
    const { vaultPda } = await createAndInitializeVault({
      program,
      ownerKeypair,
      planTitle,
    });

    const args = getDefaultPlanArgs();
    const { tx } = await getSubmitPlanTx({
      program,
      ownerPublicKey: ownerKeypair.publicKey,
      vaultPda,
      args,
    });

    await expect(txSendAndConfirm(program, tx, [ownerKeypair])).rejects.toThrow(
      /Vault funds must be greater than 0/,
    );
  });

  it("Should fail to submit a plan by a different user", async () => {
    const planTitle = "different-user-submit";
    const anotherUser = web3.Keypair.generate();
    const { vaultPda } = await createAndInitializeVault({
      program,
      ownerKeypair,
      planTitle,
    });

    const args = getDefaultPlanArgs();
    const { tx } = await getSubmitPlanTx({
      program,
      ownerPublicKey: anotherUser.publicKey,
      vaultPda,
      args,
    });

    await expect(txSendAndConfirm(program, tx, [anotherUser])).rejects.toThrow(
      /ConstraintHasOne/,
    );
  });

  it("Should fail with long content URI", async () => {
    const planTitle = "long-uri-submit";
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

    const args = {
      ...getDefaultPlanArgs(),
      contentUri: "https://example.com/" + "a".repeat(200),
    };

    const { tx: submitTx } = await getSubmitPlanTx({
      program,
      ownerPublicKey: ownerKeypair.publicKey,
      vaultPda,
      args,
    });
    await expect(
      txSendAndConfirm(program, submitTx, [ownerKeypair]),
    ).rejects.toThrow(/TooLong/);
  });
});
