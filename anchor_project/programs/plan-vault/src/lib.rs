#![allow(unexpected_cfgs)]
#![allow(deprecated)]

pub mod constants;
pub mod error;
pub mod handlers;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use handlers::*;

declare_id!("AMUvCRdBydMJ5jpYcBFFtFuwEpFCLFrbk5qByhmnzjy8");

#[program]
pub mod plan_vault {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>, plan_title: String) -> Result<()> {
        initialize_handler(ctx, plan_title)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        deposit_handler(ctx, amount)
    }
}
