-- Development database initialization script
-- This script is run when the PostgreSQL container starts for the first time

-- Create additional databases if needed
CREATE DATABASE devmeet_test;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE devmeet_dev TO postgres;
GRANT ALL PRIVILEGES ON DATABASE devmeet_test TO postgres;

-- Enable necessary extensions
\c devmeet_dev;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c devmeet_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";