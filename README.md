# ARIA Voice Agent Platform
### Full-Stack SaaS · Deploy to Railway in ~10 minutes

---

## Stack
| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Recharts |
| Backend | Node.js + Express |
| Database | PostgreSQL (Railway managed) |
| Telephony | Twilio (SIP/Voice) |
| AI | OpenAI GPT-4o-mini |
| Notifications | Twilio SMS + Nodemailer |
| CRM | GoHighLevel REST API |
| Realtime | WebSockets (ws) |
| Auth | JWT + bcrypt |
| Hosting | Railway |

---

## Railway Deploy (Step-by-Step)

### 1. Push to GitHub
```bash
cd aria-saas
git init
git add .
git commit -m "Initial ARIA Platform"
git remote add origin https://github.com/YOUR_USERNAME/aria-saas.git
git push -u origin main
```

### 2. Create Railway Project
1. Go to **railway.app** → New Project → Deploy from GitHub
2. Select your `aria-saas` repo
3. Railway auto-detects Node.js and runs `railway.toml`

### 3. Add PostgreSQL
1. In Railway project → **+ New** → **Database** → **PostgreSQL**
2. Railway auto-sets `DATABASE_URL` in your service's environment

### 4. Set Environment Variables
In Railway → your service → **Variables**, add:

```
NODE_ENV=production
JWT_SECRET=<generate with: openssl rand -hex 32>
FRONTEND_URL=https://YOUR-APP.up.railway.app

# Twilio (from twilio.com console)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token

# OpenAI
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email (SendGrid recommended)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
SMTP_FROM=noreply@ariaplatform.io
```

### 5. Configure Twilio
1. Buy a phone number at **twilio.com/console**
2. Go to Phone Numbers → Active Numbers → click your number
3. Under **Voice & Fax → A Call Comes In**, set:
   - **Webhook**: `https://YOUR-APP.up.railway.app/voice/inbound`
   - **HTTP POST**
4. Under **Call Status Changes**, set:
   - `https://YOUR-APP.up.railway.app/voice/status`

### 6. First Login
1. Visit `https://YOUR-APP.up.railway.app`
2. Click **Create Account**
3. Enter your name, business name, email, password
4. Go to **Settings → Twilio** and enter your credentials
5. Go to **Agent Builder** and customize ARIA
6. Add your FAQs in **Scripts & FAQ**
7. Your phone number is now live — test it!

---

## Local Development

```bash
# Clone & install
git clone https://github.com/YOUR_USERNAME/aria-saas
cd aria-saas
cp backend/.env.example backend/.env
# Edit backend/.env with your keys

# Install all deps
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Run migrations
cd backend && node src/db/migrate.js && cd ..

# Start both servers
npm run dev
# Backend: http://localhost:3001
# Frontend: http://localhost:5173
```

---

## Architecture

```
Railway
├── Service: aria-api (Node.js)
│   ├── Express REST API  (/api/*)
│   ├── WebSocket server  (/ws)
│   ├── Twilio Voice TwiML (/voice/*)
│   └── Serves React frontend (dist/)
│
└── Service: PostgreSQL
    └── Managed DB (DATABASE_URL auto-injected)

External
├── Twilio  → calls your /voice/inbound webhook
├── OpenAI  → GPT-4o-mini for AI responses
├── GHL API → CRM sync on each call
└── SendGrid → email notifications
```

---

## Key Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/voice/inbound` | Twilio calls this on every inbound call |
| POST | `/voice/respond` | Handles each speech turn |
| POST | `/voice/voicemail` | Records voicemail |
| POST | `/voice/status` | Call ended callback |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get JWT |
| GET | `/api/calls` | List calls |
| GET | `/api/analytics/summary` | Dashboard stats |
| WS | `/ws?token=JWT` | Real-time events |

---

## Pricing Guidance (reselling ARIA)

| Tier | Monthly | Setup | Features |
|---|---|---|---|
| Starter | $297/mo | $349 | 1 number, FAQ, voicemail, SMS |
| Pro | $597/mo | $849 | + booking, transfer, CRM sync |
| Agency | $997/mo | $1,500 | + multi-agent, white-label, reports |

**Your hard costs per client:**
- Twilio: ~$1/mo per number + ~$0.0085/min
- OpenAI: ~$2–5/mo per active client
- Railway: ~$5/mo total (shared backend)

**Margin: ~92%+ at Pro tier**

---

## Extending ARIA

### Add ElevenLabs TTS
Replace `Polly.Joanna-Neural` in `voice.js` with ElevenLabs streaming TTS.
Set `ELEVENLABS_API_KEY` env var and stream audio directly to Twilio.

### Add Deepgram STT  
Use Twilio Media Streams → WebSocket → Deepgram for higher accuracy.
Replace Twilio's built-in `<Gather input="speech">` with a media stream.

### Add Stripe Billing
Use `stripe` npm package. Add a `subscriptions` table.
Gate features by `org.plan`. Webhook at `/webhooks/stripe`.

### Multi-tenant white-label
Each org gets its own agent config, FAQs, and Twilio sub-account.
Already architected — just set per-org Twilio credentials in Settings.
