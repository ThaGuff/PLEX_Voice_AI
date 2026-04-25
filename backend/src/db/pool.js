const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => console.error('Pool error:', err.message));

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    console.log('✅ Database connected');
    await migrate(client);
    console.log('✅ Migrations complete');
  } finally {
    client.release();
  }
}

async function migrate(client) {
  await client.query(`
    -- Organizations (tenants)
    CREATE TABLE IF NOT EXISTS organizations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter','pro','agency','enterprise')),
      -- Telephony
      twilio_account_sid TEXT,
      twilio_auth_token TEXT,
      twilio_phone_number TEXT,
      -- AI
      openai_api_key TEXT,
      elevenlabs_api_key TEXT,
      elevenlabs_voice_id TEXT DEFAULT 'EXAVITQu4vr4xnSDxMaL',
      deepgram_api_key TEXT,
      -- CRM
      ghl_api_key TEXT,
      ghl_location_id TEXT,
      hubspot_api_key TEXT,
      salesforce_instance_url TEXT,
      salesforce_access_token TEXT,
      -- Notifications
      notification_email TEXT,
      notification_sms TEXT,
      slack_webhook_url TEXT,
      sendgrid_api_key TEXT,
      -- Calendar
      google_calendar_id TEXT,
      calendly_api_key TEXT,
      -- Billing
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      -- Settings
      timezone TEXT DEFAULT 'America/Chicago',
      business_hours JSONB DEFAULT '{"mon_fri":{"open":"08:00","close":"18:00"},"sat":{"open":"09:00","close":"16:00"},"sun":"closed"}',
      features JSONB DEFAULT '{}',
      white_label_domain TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'member' CHECK (role IN ('superadmin','owner','admin','member')),
      avatar_url TEXT,
      last_login TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- AI Agents
    CREATE TABLE IF NOT EXISTS agents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL DEFAULT 'ARIA',
      industry TEXT DEFAULT 'general',
      voice_provider TEXT DEFAULT 'elevenlabs' CHECK (voice_provider IN ('elevenlabs','ttsedge','twilio','openai')),
      voice_id TEXT DEFAULT 'EXAVITQu4vr4xnSDxMaL',
      voice_name TEXT DEFAULT 'Rachel',
      voice_settings JSONB DEFAULT '{"stability":0.75,"similarity_boost":0.85,"style":0.2,"speed":1.0}',
      system_prompt TEXT DEFAULT 'You are a professional AI receptionist. Be warm, helpful, and concise.',
      greeting TEXT DEFAULT 'Thank you for calling! This is ARIA. How can I help you today?',
      after_hours_msg TEXT DEFAULT 'Our office is currently closed. Please leave a message and we will get back to you.',
      goodbye_msg TEXT DEFAULT 'Thank you for calling. Have a great day!',
      transfer_number TEXT,
      transfer_prompt TEXT DEFAULT 'I am going to transfer you to a team member who can better assist you.',
      escalation_keywords TEXT[] DEFAULT ARRAY['emergency','urgent','manager','supervisor','cancel'],
      booking_enabled BOOLEAN DEFAULT true,
      booking_prompt TEXT DEFAULT 'I can schedule an appointment for you. What type of service are you looking for?',
      faq_enabled BOOLEAN DEFAULT true,
      voicemail_enabled BOOLEAN DEFAULT true,
      sms_followup_enabled BOOLEAN DEFAULT true,
      sms_followup_template TEXT DEFAULT 'Hi! We missed your call at {business_name}. We will reach out shortly. Reply STOP to opt out.',
      max_call_duration INTEGER DEFAULT 600,
      silence_timeout INTEGER DEFAULT 5,
      workflow JSONB DEFAULT '[]',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Contacts (CRM)
    CREATE TABLE IF NOT EXISTS contacts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT,
      phone TEXT NOT NULL,
      email TEXT,
      company TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      tags TEXT[] DEFAULT '{}',
      lead_score INTEGER DEFAULT 0,
      status TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','booked','won','lost','unsubscribed')),
      source TEXT DEFAULT 'inbound_call',
      pipeline_stage TEXT DEFAULT 'new',
      crm_contact_id TEXT,
      crm_synced BOOLEAN DEFAULT false,
      last_contact_at TIMESTAMPTZ,
      notes TEXT,
      custom_fields JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Calls
    CREATE TABLE IF NOT EXISTS calls (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      agent_id UUID REFERENCES agents(id),
      contact_id UUID REFERENCES contacts(id),
      twilio_call_sid TEXT UNIQUE,
      caller_phone TEXT NOT NULL,
      caller_name TEXT,
      direction TEXT DEFAULT 'inbound',
      call_type TEXT DEFAULT 'general',
      outcome TEXT DEFAULT 'answered' CHECK (outcome IN ('answered','booked','voicemail','transferred','missed','in-progress','failed')),
      duration_seconds INTEGER DEFAULT 0,
      summary TEXT,
      transcript TEXT,
      sentiment TEXT CHECK (sentiment IN ('positive','neutral','negative')),
      intent_scores JSONB DEFAULT '{}',
      extracted_data JSONB DEFAULT '{}',
      recording_url TEXT,
      crm_synced BOOLEAN DEFAULT false,
      crm_contact_id TEXT,
      started_at TIMESTAMPTZ DEFAULT NOW(),
      ended_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Recordings
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

    -- Appointments
    CREATE TABLE IF NOT EXISTS appointments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      contact_id UUID REFERENCES contacts(id),
      call_id UUID REFERENCES calls(id),
      title TEXT,
      contact_name TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      contact_email TEXT,
      service_type TEXT,
      scheduled_at TIMESTAMPTZ NOT NULL,
      duration_minutes INTEGER DEFAULT 60,
      status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','cancelled','completed','no_show')),
      booked_via TEXT DEFAULT 'voice',
      notes TEXT,
      reminder_sent BOOLEAN DEFAULT false,
      sms_sent BOOLEAN DEFAULT false,
      crm_event_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Voicemails
    CREATE TABLE IF NOT EXISTS voicemails (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      contact_id UUID REFERENCES contacts(id),
      call_id UUID REFERENCES calls(id),
      caller_name TEXT,
      caller_phone TEXT NOT NULL,
      recording_url TEXT,
      transcript TEXT,
      duration_seconds INTEGER DEFAULT 0,
      is_read BOOLEAN DEFAULT false,
      sms_recovery_sent BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- FAQs / Knowledge Base
    CREATE TABLE IF NOT EXISTS faqs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      agent_id UUID REFERENCES agents(id),
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      usage_count INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Conversations (SMS/Email threads)
    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      contact_id UUID REFERENCES contacts(id),
      channel TEXT DEFAULT 'sms' CHECK (channel IN ('sms','email','voice','webchat')),
      status TEXT DEFAULT 'open' CHECK (status IN ('open','closed','pending')),
      last_message TEXT,
      last_message_at TIMESTAMPTZ,
      unread_count INTEGER DEFAULT 0,
      assigned_to UUID REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Messages
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
      org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      direction TEXT DEFAULT 'outbound' CHECK (direction IN ('inbound','outbound')),
      channel TEXT DEFAULT 'sms',
      body TEXT NOT NULL,
      status TEXT DEFAULT 'sent',
      sender_name TEXT,
      media_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      icon TEXT DEFAULT '🔔',
      color TEXT DEFAULT 'gray',
      reference_id UUID,
      reference_type TEXT,
      action_url TEXT,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Integration configs
    CREATE TABLE IF NOT EXISTS integrations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      config JSONB DEFAULT '{}',
      is_active BOOLEAN DEFAULT false,
      last_sync TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(org_id, provider)
    );

    -- Events queue
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
    CREATE INDEX IF NOT EXISTS idx_calls_org_started ON calls(org_id, started_at DESC);
    CREATE INDEX IF NOT EXISTS idx_contacts_org_phone ON contacts(org_id, phone);
    CREATE INDEX IF NOT EXISTS idx_appointments_org_scheduled ON appointments(org_id, scheduled_at);
    CREATE INDEX IF NOT EXISTS idx_voicemails_org_read ON voicemails(org_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_org_read ON notifications(org_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_conversations_org_status ON conversations(org_id, status);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
  `);
}

module.exports = { pool, initDB };
