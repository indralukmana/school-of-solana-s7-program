use crate::state::VaultStatus;
use anchor_lang::prelude::*;
use sha2::{Digest, Sha256};

use crate::{constants::VAULT_SEED, error::InitializeErrors, state::VaultAccount};

#[derive(Accounts)]
#[instruction(plan_title: String)]
pub struct InitializeVault<'info> {
    #[account(mut, signer)]
    pub owner: Signer<'info>,

    #[account(
        init, // create the account,
        payer = owner, // who pays for the account creation
        space = 8 + VaultAccount::INIT_SPACE,
        seeds = [VAULT_SEED.as_bytes(), &Sha256::digest(plan_title.as_bytes())[..], owner.key().as_ref()],
        bump
    )]
    pub vault_account: Account<'info, VaultAccount>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_handler(ctx: Context<InitializeVault>, plan_title: String) -> Result<()> {
    require!(plan_title.len() >= 3, InitializeErrors::TitleTooShort);
    require!(plan_title.len() <= 200, InitializeErrors::TitleTooLong);
    require!(!plan_title.is_empty(), InitializeErrors::EmptyTitle);

    let vault = &mut ctx.accounts.vault_account;
    vault.owner = *ctx.accounts.owner.key;
    vault.status = VaultStatus::Locked; // initial locked
    vault.token_vault = Pubkey::default();
    vault.plan_title = plan_title.clone();
    vault
        .plan_title_hash
        .copy_from_slice(&Sha256::digest(plan_title.as_bytes())[..]);

    Ok(())
}
