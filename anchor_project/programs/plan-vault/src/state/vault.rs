use super::enums::VaultStatus;
use anchor_lang::prelude::*;

pub const MAX_TITLE_LENGTH: usize = 100;

#[account]
#[derive(InitSpace)]
pub struct VaultAccount {
    pub owner: Pubkey,
    pub status: VaultStatus,
    pub token_vault: Pubkey,
    #[max_len(MAX_TITLE_LENGTH)]
    pub plan_title: String,
}
