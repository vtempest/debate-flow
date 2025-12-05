-- Create flows table for storing debate flows
CREATE TABLE IF NOT EXISTS flows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  debate_style TEXT NOT NULL,
  columns JSONB NOT NULL DEFAULT '[]',
  children JSONB NOT NULL DEFAULT '[]',
  speech_documents JSONB DEFAULT '{}',
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_flows_archived ON flows(archived);
CREATE INDEX IF NOT EXISTS idx_flows_created_at ON flows(created_at DESC);

-- Create flow_history table for storing flow snapshots
CREATE TABLE IF NOT EXISTS flow_history (
  id SERIAL PRIMARY KEY,
  flow_id TEXT NOT NULL,
  flow_name TEXT NOT NULL,
  flow_data JSONB NOT NULL,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for history queries
CREATE INDEX IF NOT EXISTS idx_flow_history_saved_at ON flow_history(saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_flow_history_flow_id ON flow_history(flow_id);
