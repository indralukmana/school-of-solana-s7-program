use anchor_lang::prelude::*;

#[error_code]
pub enum InitializeErrors {
    #[msg("Title length exceeds maximum allowed length")]
    TitleTooLong,
}
