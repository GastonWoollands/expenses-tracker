-- =============================================
-- Transaction Attachments Table
-- =============================================
-- File attachments for transactions (receipts, invoices, etc.)
-- Supports multiple attachments per transaction

CREATE TABLE transaction_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transaction_attachments_transaction_id ON transaction_attachments(transaction_id);
CREATE INDEX idx_transaction_attachments_uploaded_at ON transaction_attachments(uploaded_at);

-- Comments
COMMENT ON TABLE transaction_attachments IS 'File attachments for transactions (receipts, invoices, etc.)';
COMMENT ON COLUMN transaction_attachments.transaction_id IS 'Reference to transactions table';
COMMENT ON COLUMN transaction_attachments.file_name IS 'Original file name';
COMMENT ON COLUMN transaction_attachments.file_path IS 'Path to stored file';
COMMENT ON COLUMN transaction_attachments.file_size IS 'File size in bytes';
COMMENT ON COLUMN transaction_attachments.mime_type IS 'MIME type of the file';
COMMENT ON COLUMN transaction_attachments.uploaded_at IS 'When file was uploaded';
