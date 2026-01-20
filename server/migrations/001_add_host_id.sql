-- Migration: Add host_id column to games table
-- This migration adds the host_id column to track which player is the host
-- The host is set when the game is created and never changes

-- Add host_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'games' AND column_name = 'host_id'
    ) THEN
        ALTER TABLE games ADD COLUMN host_id UUID REFERENCES players(player_id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_games_host ON games(host_id);

-- For existing games without a host, set the first player as host
-- (This is a one-time migration for existing data)
UPDATE games g
SET host_id = (
    SELECT player_id FROM players p
    WHERE p.player_id = (g.players_list->>0)::uuid
    LIMIT 1
)
WHERE g.host_id IS NULL
AND jsonb_array_length(g.players_list) > 0;
