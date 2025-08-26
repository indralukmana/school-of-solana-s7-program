use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum VaultStatus {
    Locked,
    Unlocked,
}

impl Default for VaultStatus {
    fn default() -> Self {
        Self::Locked
    }
}
