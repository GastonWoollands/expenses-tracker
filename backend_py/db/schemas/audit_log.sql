-- =============================================
-- Audit Log Table
-- =============================================
-- Audit trail for all data changes
-- Tracks who changed what and when for compliance and debugging

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_operation ON audit_log(operation);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Comments
COMMENT ON TABLE audit_log IS 'Audit trail for all data changes';
COMMENT ON COLUMN audit_log.table_name IS 'Name of the table that was modified';
COMMENT ON COLUMN audit_log.record_id IS 'ID of the record that was modified';
COMMENT ON COLUMN audit_log.operation IS 'Type of operation (INSERT, UPDATE, DELETE)';
COMMENT ON COLUMN audit_log.user_id IS 'User who performed the operation';
COMMENT ON COLUMN audit_log.old_values IS 'Previous values (for UPDATE/DELETE)';
COMMENT ON COLUMN audit_log.new_values IS 'New values (for INSERT/UPDATE)';
COMMENT ON COLUMN audit_log.changed_fields IS 'Array of field names that changed';
COMMENT ON COLUMN audit_log.ip_address IS 'IP address of the user';
COMMENT ON COLUMN audit_log.user_agent IS 'User agent string';
