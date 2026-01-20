-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Games table
CREATE TABLE IF NOT EXISTS games (
    game_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    players_list JSONB DEFAULT '[]'::jsonb,
    game_status VARCHAR(50) DEFAULT 'waiting',
    created_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
    player_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_name VARCHAR(100) NOT NULL,
    current_game_id UUID REFERENCES games(game_id) ON DELETE SET NULL,
    player_status VARCHAR(50) DEFAULT 'active',
    score INTEGER DEFAULT 0
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_players_current_game ON players(current_game_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(game_status);

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
