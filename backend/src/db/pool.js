const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected pool error', err);
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    console.log('✅ Database connected');
    await runMigrations(client);
  } finally {
    client.release();
  }
}

async function runMigrations(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter','pro','agency')),
      twilio_account_sid TEXT,
      twilio_auth_token TEXT,
      twilio_phone_number TEXT,
      ghl_api_key TEXT,
      ghl_location_id TEXT,
      openai_api_key TEXT,
      elevenlabs_api_key TEXT,
      notification_email TEXT,
      notification_sms TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS agents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL DEFAULT 'ARIA',
      voice_style TEXT DEFAULT 'rachel',
      greeting TEXT,
      after_hours_msg TEXT,
      business_hours JSONB DEFAULT '{}',
      features JSONB DEFAULT '{}',
      transfer_number TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS calls (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      agent_id UUID REFERENCES agents(id),
      twilio_call_sid TEXT UNIQUE,
      caller_name TEXT,
      caller_phone TEXT NOT NULL,
      direction TEXT DEFAULT 'inbound',
      call_type TEXT DEFAULT 'general',
      outcome TEXT DEFAULT 'answered',
      duration_seconds INTEGER DEFAULT 0,
      summary TEXT,
      sentiment TEXT,
      intent_scores JSONB DEFAULT '{}',
      crm_synced BOOLEAN DEFAULT false,
      crm_contact_id TEXT,
      started_at TIMESTAMPTZ DEFAULT NOW(),
      ended_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS recordings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
      org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      twilio_recording_sid TEXT,
      url TEXT,
      duration_seconds INTEGER,
      file_size_bytes INTEGER,
      transcript TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      call_id UUID REFERENCES calls(id),
      contact_name TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      service_type TEXT,
      scheduled_at TIMESTAMPTZ NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed')),
      booked_via TEXT DEFAULT 'voice',
      notes TEXT,
      sms_sent BOOLEAN DEFAULT false,
      crm_event_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS voicemails (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      call_id UUID REFERENCES calls(id),
      caller_name TEXT,
      caller_phone TEXT NOT NULL,
      recording_url TEXT,
      transcript TEXT,
      duration_seconds INTEGER,
      is_read BOOLEAN DEFAULT false,
      sms_recovery_sent BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS faqs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      agent_id UUID REFERENCES agents(id),
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      usage_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      reference_id UUID,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      payload JSONB DEFAULT '{}',
      processed BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Indexes
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_calls_org ON calls(org_id);
    CREATE INDEX IF NOT EXISTS idx_calls_started ON calls(started_at DESC);
    CREATE INDEX IF NOT EXISTS idx_appointments_org ON appointments(org_id);
    CREATE INDEX IF NOT EXISTS idx_voicemails_org ON voicemails(org_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_org ON notifications(org_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_events_org_proc ON events(org_id, processed);
  `);

  console.log('✅ Migrations complete');
}

module.exports = { pool, initDB };
