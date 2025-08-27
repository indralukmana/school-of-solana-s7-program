use anchor_lang::prelude::*;

use crate::{
    error::SubmitPlanErrors,
    state::{Plan, VaultAccount, VaultStatus},
};

#[derive(Accounts)]
pub struct SubmitPlan<'info> {
    #[account(mut, has_one = owner)]
    pub vault_account: Account<'info, VaultAccount>, // The vault PDA

    #[account(mut, signer)]
    pub owner: Signer<'info>, // The user's wallet, need to sign

    #[account(mut, has_one = vault_account)]
    pub plan: Account<'info, Plan>,

    pub system_program: Program<'info, System>,
}

// Named-parameters for creating a Plan
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PlanArgs {
    pub trading_platform: String,
    pub risk_level: String,
    pub ticker: String,
    pub investment_amount: u64,
    pub stop_loss: f64,
    pub take_profit: f64,
}

pub fn submit_plan_handler(ctx: Context<SubmitPlan>, args: PlanArgs) -> Result<()> {
    let vault = &mut ctx.accounts.vault_account;

    // Current lamports in the vault account
    let lamports = vault.to_account_info().lamports();

    // Compute rent-exempt minimum for this account's current data size
    // Anchor accounts have the discriminator included in the size
    let data_len = vault.to_account_info().data_len();
    let rent_exempt = Rent::get()?.minimum_balance(data_len);

    // Check for positive balance above rent
    require!(
        lamports > rent_exempt,
        SubmitPlanErrors::InsufficientVaultFunds
    );
    vault.status = VaultStatus::Unlocked;

    let plan = &mut ctx.accounts.plan;

    require!(
        args.trading_platform.len() <= 100,
        SubmitPlanErrors::TooLong
    );
    require!(args.risk_level.len() <= 100, SubmitPlanErrors::TooLong);
    require!(args.ticker.len() <= 10, SubmitPlanErrors::TooLong);

    plan.trading_platform = args.trading_platform;
    plan.risk_level = args.risk_level;
    plan.ticker = args.ticker;
    plan.investment_amount = args.investment_amount;
    plan.stop_loss = args.stop_loss;
    plan.take_profit = args.take_profit;
    plan.plan_title = vault.plan_title.clone();

    Ok(())
}
