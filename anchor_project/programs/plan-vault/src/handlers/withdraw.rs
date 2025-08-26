use anchor_lang::prelude::*;

use crate::state::VaultAccount;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut, has_one = owner, close = owner)]
    pub vault_account: Account<'info, VaultAccount>, // The vault PDA

    #[account(mut, signer)]
    pub owner: Signer<'info>, // The user's wallet, need to sign
}

pub fn withdraw_handler(ctx: Context<Withdraw>) -> Result<()> {
    let vault = &mut ctx.accounts.vault_account;
    let owner = &mut ctx.accounts.owner;

    require!(
        vault.status == crate::state::VaultStatus::Unlocked,
        crate::error::WithdrawErrors::VaultLocked
    );

    let vault_balance = vault.to_account_info().lamports();
    vault.sub_lamports(vault_balance)?;
    owner.add_lamports(vault_balance)?;

    Ok(())
}
