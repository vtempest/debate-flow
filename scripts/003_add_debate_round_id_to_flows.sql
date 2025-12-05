-- Add missing columns to flows table to match Flow type
ALTER TABLE flows ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '';
ALTER TABLE flows ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0;
ALTER TABLE flows ADD COLUMN IF NOT EXISTS invert BOOLEAN DEFAULT false;
ALTER TABLE flows ADD COLUMN IF NOT EXISTS index INTEGER DEFAULT 0;
ALTER TABLE flows ADD COLUMN IF NOT EXISTS last_focus JSONB DEFAULT '[]';
ALTER TABLE flows ADD COLUMN IF NOT EXISTS debate_round_id TEXT;

-- Create index for better query performance on debate_round_id
CREATE INDEX IF NOT EXISTS idx_flows_debate_round_id ON flows(debate_round_id);

-- Remove old debate_style column if it exists (not in current Flow type)
-- This is commented out to avoid data loss, uncomment if needed:
-- ALTER TABLE flows DROP COLUMN IF EXISTS debate_style;
