use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Plan {
    pub vault_account: Pubkey,
    #[max_len(100)]
    pub plan_title: String,
    #[max_len(100)]
    pub trading_platform: String,
    #[max_len(100)]
    pub risk_level: String,
    #[max_len(10)]
    pub ticker: String,
    pub investment_amount: u64,
    pub stop_loss_bps: u64,
    pub take_profit_bps: u64,
}
