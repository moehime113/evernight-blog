CREATE TABLE IF NOT EXISTS comments (
  id bigint GENERATED ALWAYS AS IDENTITY (MAXVALUE 9007199254740991) PRIMARY KEY,
  thread text NOT NULL CHECK (char_length(thread) BETWEEN 1 AND 1024),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000 AND btrim(body) <> ''),
  github_user_id text NOT NULL CHECK (github_user_id ~ '^[1-9][0-9]{0,19}$'),
  github_login text NOT NULL CHECK (github_login ~ '^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}$'),
  created_at timestamptz NOT NULL DEFAULT statement_timestamp()
);

CREATE INDEX IF NOT EXISTS comments_thread_created_id ON comments (thread, created_at, id);

CREATE TABLE IF NOT EXISTS comment_rate_limits (
  github_user_id text PRIMARY KEY CHECK (github_user_id ~ '^[1-9][0-9]{0,19}$'),
  last_posted_at timestamptz NOT NULL
);
