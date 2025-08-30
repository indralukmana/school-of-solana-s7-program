use super::enums::VaultStatus;
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct VaultAccount {
    pub owner: Pubkey,
    pub status: VaultStatus,
    pub token_vault: Pubkey,
    pub plan_title_hash: [u8; 32],
    #[max_len(200)]
    pub plan_title: String,
}
