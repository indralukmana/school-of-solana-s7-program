use anchor_lang::prelude::*;

#[error_code]
pub enum PlanVaultError {
    #[msg("Title must be at least 3 characters")]
    TitleTooShort,
    #[msg("Title must not exceed 200 characters")]
    TitleTooLong,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Failed to transfer tokens")]
    TransferFailed,
    #[msg("Must transfer more than 0")]
    MustTransferMoreThanZero,
    #[msg("Vault is not locked")]
    VaultNotLocked,
    #[msg("Vault is locked")]
    VaultLocked,
    #[msg("Vault funds must be greater than 0")]
    InsufficientVaultFunds,
    #[msg("Input string exceeds max length")]
    TooLong,
    #[msg("Plan already submitted for this vault")]
    PlanAlreadySubmitted,
}
