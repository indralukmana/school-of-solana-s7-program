use anchor_lang::prelude::*;

use crate::error::PlanVaultError;
use crate::state::{VaultAccount, VaultStatus};

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut, has_one = owner)]
    pub vault_account: Account<'info, VaultAccount>, // The vault PDA

    #[account(mut, signer)]
    pub owner: Signer<'info>, // The user's wallet, need to sign
}

pub fn withdraw_handler(ctx: Context<Withdraw>) -> Result<()> {
    let vault = &mut ctx.accounts.vault_account;
    let owner = &mut ctx.accounts.owner;

    require!(
        vault.status == VaultStatus::Unlocked,
        PlanVaultError::VaultLocked
    );

    // Compute rent-exempt minimum for this account's current data size
    // Anchor accounts have the discriminator included in the size
    let data_len = vault.to_account_info().data_len();
    let rent_exempt = Rent::get()?.minimum_balance(data_len);
    let vault_balance = vault.to_account_info().lamports();

    // Current lamports in the vault account
    let withdraw_amount = vault_balance - rent_exempt;

    vault.sub_lamports(withdraw_amount)?;
    owner.add_lamports(withdraw_amount)?;

    Ok(())
}
