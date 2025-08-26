use anchor_lang::prelude::*;

use crate::{
    error::SubmitPlanErrors,
    state::{VaultAccount, VaultStatus},
};

#[derive(Accounts)]
pub struct SubmitPlan<'info> {
    #[account(mut, has_one = owner)]
    pub vault_account: Account<'info, VaultAccount>, // The vault PDA

    #[account(mut, signer)]
    pub owner: Signer<'info>, // The user's wallet, need to sign
    pub system_program: Program<'info, System>,
}

pub fn submit_plan_handler(ctx: Context<SubmitPlan>) -> Result<()> {
    let vault = &mut ctx.accounts.vault_account;

    // Current lamports in the vault account
    let lamports = vault.to_account_info().lamports();

    // Compute rent-exempt minimum for this account's current data size
    // Anchor accounts have the discriminator included in the size
    let data_len = vault.to_account_info().data_len();
    let rent_exempt = Rent::get()?.minimum_balance(data_len);

    // Check for positive balance above rent
    require!(
        lamports > rent_exempt,
        SubmitPlanErrors::InsufficientVaultFunds
    );
    vault.status = VaultStatus::Unlocked;

    Ok(())
}
