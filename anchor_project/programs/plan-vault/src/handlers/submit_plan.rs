use anchor_lang::prelude::*;

use crate::{
    error::PlanVaultError,
    state::{Plan, VaultAccount, VaultStatus},
};

#[derive(Accounts)]
pub struct SubmitPlan<'info> {
    #[account(mut, has_one = owner)]
    pub vault_account: Account<'info, VaultAccount>,

    #[account(mut, signer)]
    pub owner: Signer<'info>,

    #[account(mut, has_one = vault_account)]
    pub plan: Account<'info, Plan>,

    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PlanArgs {
    pub content_hash: [u8; 32],
    pub content_uri: String,
}

pub fn submit_plan_handler(ctx: Context<SubmitPlan>, args: PlanArgs) -> Result<()> {
    let vault = &mut ctx.accounts.vault_account;

    let lamports = vault.to_account_info().lamports();
    let data_len = vault.to_account_info().data_len();
    let rent_exempt = Rent::get()?.minimum_balance(data_len);

    require!(
        lamports > rent_exempt,
        PlanVaultError::InsufficientVaultFunds
    );

    require!(
        !matches!(vault.status, VaultStatus::Unlocked),
        PlanVaultError::VaultNotLocked
    );

    vault.status = VaultStatus::Unlocked;

    let plan = &mut ctx.accounts.plan;

    require!(args.content_uri.len() <= 200, PlanVaultError::TooLong);

    plan.content_hash = args.content_hash;
    plan.content_uri = args.content_uri;

    Ok(())
}
