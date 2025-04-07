-- Create the `waitlist_entries` table
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  company VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);