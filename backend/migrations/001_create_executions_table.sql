-- Create workflow_executions table for storing execution logs

CREATE TABLE IF NOT EXISTS workflow_executions (
  id TEXT PRIMARY KEY,
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'error')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  logs JSONB,
  error TEXT,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON workflow_executions(started_at DESC);

-- Add columns to workflows table for activation status
ALTER TABLE workflows 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS test_mode JSONB,
ADD COLUMN IF NOT EXISTS last_execution_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS execution_count INTEGER DEFAULT 0;

-- Create index on is_active for faster queries
CREATE INDEX IF NOT EXISTS idx_workflows_is_active ON workflows(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to view their own execution logs
CREATE POLICY IF NOT EXISTS "Users can view their own execution logs"
ON workflow_executions FOR SELECT
USING (
  workflow_id IN (
    SELECT id FROM workflows WHERE user_id = auth.uid()
  )
);

-- Create policy for the backend service to insert/update execution logs
-- Note: You'll need to use the service role key in the backend for this to work
CREATE POLICY IF NOT EXISTS "Service can manage all execution logs"
ON workflow_executions FOR ALL
USING (true);

COMMENT ON TABLE workflow_executions IS 'Stores execution logs for workflows';
COMMENT ON COLUMN workflow_executions.id IS 'Unique execution ID';
COMMENT ON COLUMN workflow_executions.workflow_id IS 'Reference to the workflow';
COMMENT ON COLUMN workflow_executions.status IS 'Execution status: running, success, or error';
COMMENT ON COLUMN workflow_executions.logs IS 'Detailed execution logs in JSON format';
COMMENT ON COLUMN workflow_executions.duration_ms IS 'Execution duration in milliseconds';
