use anchor_lang::prelude::*;

#[error_code]
pub enum InitializeErrors {
    #[msg("Title must be at least 3 characters")]
    TitleTooShort,
    #[msg("Title must not exceed 200 characters")]
    TitleTooLong,
    #[msg("Title must not be empty")]
    EmptyTitle,
}

// Deposit errors
#[error_code]
pub enum DepositErrors {
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Failed to transfer tokens")]
    TransferFailed,
    #[msg("Must transfer more than 0")]
    MustTransferMoreThanZero,
}
