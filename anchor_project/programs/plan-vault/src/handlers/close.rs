use anchor_lang::prelude::*;

use crate::state::{Plan, VaultAccount};

#[derive(Accounts)]
pub struct CloseVault<'info> {
    #[account(mut, has_one = owner, close = owner)]
    pub vault_account: Account<'info, VaultAccount>, // The vault PDA

    #[account(mut, signer)]
    pub owner: Signer<'info>, // The user's wallet, need to sign

    #[account(
      mut, has_one = vault_account, close = owner
    )]
    pub plan: Account<'info, Plan>,

    pub system_program: Program<'info, System>,
}

pub fn close_vault_handler(_ctx: Context<CloseVault>) -> Result<()> {
    Ok(())
}
