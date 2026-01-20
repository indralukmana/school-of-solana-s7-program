CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  avatar_url  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS plans (
  id                 TEXT PRIMARY KEY,
  vault_address      TEXT NOT NULL,
  owner_id           TEXT NOT NULL REFERENCES users(id),
  title              TEXT NOT NULL,
  description        TEXT,
  trading_platform   TEXT,
  risk_level         TEXT,
  ticker             TEXT,
  investment_lamports INTEGER,
  stop_loss_bps      INTEGER,
  take_profit_bps    INTEGER,
  tags               TEXT,
  image_urls         TEXT,
  content_hash       TEXT NOT NULL,
  content_uri        TEXT NOT NULL,
  onchain_tx         TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS outcomes (
  id              TEXT PRIMARY KEY,
  plan_id         TEXT NOT NULL REFERENCES plans(id),
  owner_id        TEXT NOT NULL REFERENCES users(id),
  pnl_lamports    INTEGER,
  notes           TEXT,
  screenshot_urls TEXT,
  settled_at      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activity_events (
  id            TEXT PRIMARY KEY,
  event_type    TEXT NOT NULL,
  actor_id      TEXT NOT NULL REFERENCES users(id),
  vault_address TEXT,
  plan_id       TEXT REFERENCES plans(id),
  signature     TEXT,
  metadata      TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS auth_nonces (
  nonce      TEXT PRIMARY KEY,
  address    TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_plans_owner ON plans(owner_id);
CREATE INDEX IF NOT EXISTS idx_plans_vault ON plans(vault_address);
CREATE INDEX IF NOT EXISTS idx_outcomes_plan ON outcomes(plan_id);
CREATE INDEX IF NOT EXISTS idx_activity_actor ON activity_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_events(event_type);
