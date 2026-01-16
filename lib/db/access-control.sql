-- Database Access Control and Row-Level Security (RLS) Policies
--
-- This file contains SQL for implementing:
-- - Row-Level Security (RLS) policies
-- - Database roles and permissions
-- - Audit logging triggers
-- - Encryption at rest configuration
--
-- Apply these policies to PostgreSQL database for production security

-- ==================== CREATE ROLES ====================

-- Application service role (read/write)
CREATE ROLE bsi_app_role NOLOGIN;

-- Read-only role for analytics/reporting
CREATE ROLE bsi_readonly_role NOLOGIN;

-- Admin role for migrations and management
CREATE ROLE bsi_admin_role NOLOGIN SUPERUSER;

-- ==================== GRANT PERMISSIONS ====================

-- App role: Read/write access to main tables
GRANT CONNECT ON DATABASE blazesportsintel TO bsi_app_role;
GRANT USAGE ON SCHEMA public TO bsi_app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bsi_app_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bsi_app_role;

-- Read-only role: Select only
GRANT CONNECT ON DATABASE blazesportsintel TO bsi_readonly_role;
GRANT USAGE ON SCHEMA public TO bsi_readonly_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO bsi_readonly_role;

-- ==================== ENABLE ROW LEVEL SECURITY ====================

-- Enable RLS on sensitive tables
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_sessions ENABLE ROW LEVEL SECURITY;

-- ==================== ROW-LEVEL SECURITY POLICIES ====================

-- Users table: Users can only see their own data
CREATE POLICY users_isolation ON users
    FOR ALL
    TO bsi_app_role
    USING (id = current_setting('app.current_user_id', TRUE)::INTEGER);

-- API keys: Users can only access their own keys
CREATE POLICY api_keys_isolation ON api_keys
    FOR ALL
    TO bsi_app_role
    USING (user_id = current_setting('app.current_user_id', TRUE)::INTEGER);

-- Sessions: Users can only access their own sessions
CREATE POLICY sessions_isolation ON user_sessions
    FOR ALL
    TO bsi_app_role
    USING (user_id = current_setting('app.current_user_id', TRUE)::INTEGER);

-- ==================== AUDIT LOGGING ====================

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id INTEGER,
    username TEXT,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE, SELECT
    row_id TEXT,
    old_data JSONB,
    new_data JSONB,
    query TEXT,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT
);

-- Index for efficient audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_operation ON audit_log(operation);

-- Audit log trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_log (
            table_name,
            operation,
            row_id,
            old_data,
            user_id,
            username
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            OLD.id::TEXT,
            row_to_json(OLD)::JSONB,
            current_setting('app.current_user_id', TRUE)::INTEGER,
            current_setting('app.current_username', TRUE)
        );
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_log (
            table_name,
            operation,
            row_id,
            old_data,
            new_data,
            user_id,
            username
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            NEW.id::TEXT,
            row_to_json(OLD)::JSONB,
            row_to_json(NEW)::JSONB,
            current_setting('app.current_user_id', TRUE)::INTEGER,
            current_setting('app.current_username', TRUE)
        );
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_log (
            table_name,
            operation,
            row_id,
            new_data,
            user_id,
            username
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            NEW.id::TEXT,
            row_to_json(NEW)::JSONB,
            current_setting('app.current_user_id', TRUE)::INTEGER,
            current_setting('app.current_username', TRUE)
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to sensitive tables
-- (Add more tables as needed)
CREATE TRIGGER users_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER api_keys_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ==================== DATA ENCRYPTION ====================

-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT, key_name TEXT DEFAULT 'ENCRYPTION_KEY')
RETURNS TEXT AS $$
DECLARE
    encryption_key TEXT;
BEGIN
    -- Get encryption key from environment/secrets
    encryption_key := current_setting('app.' || key_name, FALSE);

    -- Encrypt using AES-256
    RETURN encode(
        pgp_sym_encrypt(data, encryption_key, 'cipher-algo=aes256'),
        'base64'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data TEXT, key_name TEXT DEFAULT 'ENCRYPTION_KEY')
RETURNS TEXT AS $$
DECLARE
    encryption_key TEXT;
BEGIN
    -- Get encryption key from environment/secrets
    encryption_key := current_setting('app.' || key_name, FALSE);

    -- Decrypt using AES-256
    RETURN pgp_sym_decrypt(
        decode(encrypted_data, 'base64'),
        encryption_key
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== CONNECTION SECURITY ====================

-- Force SSL connections in production
-- (Set in postgresql.conf: ssl = on, ssl_min_protocol_version = 'TLSv1.2')

-- Create connection limits
ALTER ROLE bsi_app_role CONNECTION LIMIT 100;
ALTER ROLE bsi_readonly_role CONNECTION LIMIT 50;

-- ==================== QUERY LOGGING ====================

-- Enable slow query logging
-- (Set in postgresql.conf:)
-- log_min_duration_statement = 1000  # Log queries slower than 1 second
-- log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
-- log_statement = 'all'  # Or 'ddl' for production

-- ==================== SECURITY BEST PRACTICES ====================

-- Revoke public schema permissions
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON DATABASE blazesportsintel FROM PUBLIC;

-- Disable dangerous functions for app roles
REVOKE EXECUTE ON FUNCTION pg_read_file(text) FROM bsi_app_role;
REVOKE EXECUTE ON FUNCTION pg_ls_dir(text) FROM bsi_app_role;

-- ==================== MONITORING ====================

-- Create view for monitoring active connections
CREATE OR REPLACE VIEW active_connections AS
SELECT
    pid,
    usename,
    application_name,
    client_addr,
    backend_start,
    state,
    query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY backend_start DESC;

-- Grant select on monitoring views
GRANT SELECT ON active_connections TO bsi_readonly_role;

-- ==================== CLEANUP ====================

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO bsi_app_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO bsi_readonly_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO bsi_app_role;

-- ==================== VERIFICATION ====================

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;

-- Verify audit log is working
SELECT COUNT(*) FROM audit_log;

-- Verify roles exist
SELECT rolname FROM pg_roles WHERE rolname LIKE 'bsi_%';
