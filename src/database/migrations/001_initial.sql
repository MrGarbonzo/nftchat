-- Users table to store verified users
CREATE TABLE IF NOT EXISTS users (
    telegram_user_id TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    username TEXT,
    first_name TEXT,
    verification_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_checked_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Verification challenges table
CREATE TABLE IF NOT EXISTS verification_challenges (
    challenge_id TEXT PRIMARY KEY,
    telegram_user_id TEXT NOT NULL,
    challenge_message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATETIME NOT NULL,
    used BOOLEAN DEFAULT 0,
    used_at DATETIME,
    FOREIGN KEY (telegram_user_id) REFERENCES users(telegram_user_id)
);

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    telegram_user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (telegram_user_id, action, timestamp)
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_user_id TEXT,
    action TEXT NOT NULL,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(is_verified);
CREATE INDEX IF NOT EXISTS idx_challenges_user ON verification_challenges(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_expiry ON verification_challenges(expiry_date);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action ON rate_limits(telegram_user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);