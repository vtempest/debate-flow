-- Create speeches table for storing speech markdown content
CREATE TABLE IF NOT EXISTS speeches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  markdown TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create debate_rounds table for organizing flows, speeches, debaters, and judges
CREATE TABLE IF NOT EXISTS debate_rounds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  debater_aff_1 TEXT,
  debater_aff_2 TEXT,
  debater_neg_1 TEXT,
  debater_neg_2 TEXT,
  judge_name TEXT,
  flow_ids JSONB NOT NULL DEFAULT '[]',
  speech_ids JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_speeches_created_at ON speeches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_debate_rounds_created_at ON debate_rounds(created_at DESC);
