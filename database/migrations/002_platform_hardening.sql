-- 002: platform hardening (auth, audit, soft-delete, climate ops, prefs)

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS facility_thresholds (
  facility_id UUID PRIMARY KEY REFERENCES facilities(id) ON DELETE CASCADE,
  temp_warn_min DECIMAL(5,2) NOT NULL DEFAULT 52,
  temp_warn_max DECIMAL(5,2) NOT NULL DEFAULT 58,
  temp_crit_min DECIMAL(5,2) NOT NULL DEFAULT 48,
  temp_crit_max DECIMAL(5,2) NOT NULL DEFAULT 62,
  humidity_warn_min DECIMAL(5,2) NOT NULL DEFAULT 55,
  humidity_warn_max DECIMAL(5,2) NOT NULL DEFAULT 75,
  humidity_crit_min DECIMAL(5,2) NOT NULL DEFAULT 45,
  humidity_crit_max DECIMAL(5,2) NOT NULL DEFAULT 85,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_mutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  alert_type VARCHAR(100),
  muted_until TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  email_digest BOOLEAN NOT NULL DEFAULT FALSE,
  in_app_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wines ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE wines ADD COLUMN IF NOT EXISTS valued_at TIMESTAMPTZ;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_wines_deleted ON wines(deleted_at);
CREATE INDEX IF NOT EXISTS idx_audit_facility ON audit_log(facility_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reset_token ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_invite_token ON invites(token_hash);
CREATE INDEX IF NOT EXISTS idx_climate_readings_ts ON climate_readings(timestamp);
