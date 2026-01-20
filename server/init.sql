-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players table with authentication fields
-- Now represents user accounts with login credentials
CREATE TABLE IF NOT EXISTS players (
    player_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    player_name VARCHAR(100) NOT NULL,
    current_game_id UUID,
    player_status VARCHAR(50) DEFAULT 'active',
    score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
    game_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_id UUID REFERENCES players(player_id) ON DELETE SET NULL,
    players_list JSONB DEFAULT '[]'::jsonb,
    game_status VARCHAR(50) DEFAULT 'waiting',
    created_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for players.current_game_id after games table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_players_current_game'
    ) THEN
        ALTER TABLE players
        ADD CONSTRAINT fk_players_current_game
        FOREIGN KEY (current_game_id) REFERENCES games(game_id) ON DELETE SET NULL;
    END IF;
END $$;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_players_current_game ON players(current_game_id);
CREATE INDEX IF NOT EXISTS idx_players_username ON players(username);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(game_status);
CREATE INDEX IF NOT EXISTS idx_games_host ON games(host_id);

-- Function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update last_updated on games table
DROP TRIGGER IF EXISTS games_last_updated ON games;
CREATE TRIGGER games_last_updated
    BEFORE UPDATE ON games
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated();
