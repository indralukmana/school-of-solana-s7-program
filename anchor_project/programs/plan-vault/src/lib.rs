#![allow(unexpected_cfgs)]
#![allow(deprecated)]

pub mod constants;
pub mod error;
pub mod handlers;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use handlers::*;

declare_id!("3TePuiM6kKgQeUb6YGbybDN1WN22x5Yi15xxoGavn5gQ");

#[program]
pub mod plan_vault {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>, plan_title: String) -> Result<()> {
        initialize_handler(ctx, plan_title)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        deposit_handler(ctx, amount)
    }

    pub fn submit_plan(ctx: Context<SubmitPlan>, args: PlanArgs) -> Result<()> {
        submit_plan_handler(ctx, args)
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        withdraw_handler(ctx)
    }
}
