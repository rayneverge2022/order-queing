-- Create the job_orders table
CREATE TABLE IF NOT EXISTS job_orders (
    id BIGSERIAL PRIMARY KEY,
    customer_name TEXT NOT NULL,
    project_details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'printing', 'packaging', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS set_updated_at ON job_orders;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON job_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
