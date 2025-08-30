use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::{
    error::DepositErrors,
    state::{VaultAccount, VaultStatus},
};

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut, has_one = owner)]
    pub vault_account: Account<'info, VaultAccount>, // The vault PDA

    #[account(mut, signer)]
    pub owner: Signer<'info>, // The user's wallet, need to sign
    pub system_program: Program<'info, System>,
}

pub fn deposit_handler(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    require!(amount > 0, DepositErrors::MustTransferMoreThanZero);
    require!(
        ctx.accounts.owner.lamports() >= amount,
        DepositErrors::InsufficientFunds
    );
    require!(
        ctx.accounts.vault_account.status == VaultStatus::Locked,
        DepositErrors::VaultNotLocked
    );

    let system_program = &mut ctx.accounts.system_program;

    let cpi_context = CpiContext::new(
        system_program.to_account_info(),
        system_program::Transfer {
            from: ctx.accounts.owner.to_account_info(),
            to: ctx.accounts.vault_account.to_account_info(),
        },
    );

    system_program::transfer(cpi_context, amount)?;

    Ok(())
}
