-- Keep legacy OTP tables for a non-destructive migration; no endpoint uses them.
ALTER TABLE users ADD COLUMN google_sub TEXT;
CREATE UNIQUE INDEX users_google_sub ON users(google_sub);
CREATE TABLE google_challenges (
  nonce_hash TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);
CREATE INDEX google_challenges_expiry ON google_challenges(expires_at);
