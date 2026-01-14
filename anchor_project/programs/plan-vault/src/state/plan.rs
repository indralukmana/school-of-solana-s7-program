use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Plan {
    pub vault_account: Pubkey,
    pub content_hash: [u8; 32],
    #[max_len(200)]
    pub content_uri: String,
}
