ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'professor'));
ALTER TABLE users ADD COLUMN last_access_change TEXT NOT NULL DEFAULT '';
CREATE TABLE access_changes (
  id TEXT PRIMARY KEY,
  actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  previous_status TEXT NOT NULL CHECK (previous_status IN ('active', 'blocked')),
  new_status TEXT NOT NULL CHECK (new_status IN ('active', 'blocked')),
  created_at INTEGER NOT NULL
);
CREATE INDEX access_changes_user ON access_changes(user_id, created_at);
CREATE INDEX users_role_created ON users(role, created_at DESC, id DESC);
