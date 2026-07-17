# OeniVault AI — Wine Business Management Platform
## Build Specification & Cursor Instructions

**Status:** Ready for Build  
**Created:** July 17, 2026  
**Platform:** Wine cellar management + climate monitoring for storage facilities & collectors  
**Timeline:** MVP in 3-4 weeks

---

## 1. PROJECT OVERVIEW

**What is OeniVault AI?**

An AI-powered wine business management platform for storage facilities (like Carl's Wine Vault) and high-end collectors. Core functions:
- **Inventory Management** — catalog wine collections, track location, add notes
- **Climate Monitoring** — real-time temp/humidity alerts from IoT sensors
- **Customer Portal** — clients view their wine, get recommendations
- **Admin Dashboard** — manage all clients, collections, reports
- **AI Insights** — wine valuations, storage recommendations, inventory optimization

**Target Users:**
- Storage facility operators (Carl's Wine Vault, luxury wine vaults)
- High-net-worth collectors (manage personal collections)
- Wine retailers (inventory management)

**Primary Use Case:** Storage facility like Carl's manages 20-50 customer collections, monitors conditions 24/7, provides web access to customers.

---

## 2. TECH STACK (FINAL)

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React 18 + TypeScript | Type safety, modern ecosystem, fast |
| **UI Framework** | TailwindCSS | Fast styling, responsive, professional |
| **Backend** | Node.js + Express | Fast, JavaScript fullstack, good for real-time |
| **Database** | PostgreSQL (Supabase) | Relational (collections, customers, sensors), real-time |
| **Real-time** | WebSockets (Socket.io) | Climate alerts, live updates |
| **Auth** | Supabase Auth (JWT) | Built-in, secure, integrated with DB |
| **Hosting** | Vercel (frontend) + Supabase (backend) | Proven, fast deploys, serverless |
| **Version Control** | GitHub (BuildTronixAI org) | All code lives here |

---

## 3. GITHUB REPOSITORY STRUCTURE

```
oenivault-ai/
├── .github/
│   └── workflows/
│       ├── deploy-frontend.yml
│       └── deploy-backend.yml
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── SignupForm.tsx
│   │   │   ├── Dashboard/
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   ├── CustomerPortal.tsx
│   │   │   │   └── ClimateMonitor.tsx
│   │   │   ├── Inventory/
│   │   │   │   ├── WineList.tsx
│   │   │   │   ├── AddWine.tsx
│   │   │   │   └── WineDetail.tsx
│   │   │   └── Common/
│   │   │       ├── Header.tsx
│   │   │       ├── Sidebar.tsx
│   │   │       └── Footer.tsx
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── InventoryPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useInventory.ts
│   │   │   └── useClimate.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   └── websocket.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── styles/
│   │   │   └── globals.css
│   │   └── App.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vercel.json
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── inventory.ts
│   │   │   ├── climate.ts
│   │   │   └── customers.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   └── errorHandler.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Collection.ts
│   │   │   ├── Wine.ts
│   │   │   └── ClimateReading.ts
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── inventoryService.ts
│   │   │   └── climateService.ts
│   │   ├── database/
│   │   │   ├── schema.sql
│   │   │   ├── migrations/
│   │   │   └── seed.sql
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   └── validation.ts
│   │   └── index.ts
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── database/
│   ├── schema.sql
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed.sql
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   └── DEPLOYMENT.md
├── .gitignore
├── README.md
└── CONTRIBUTING.md
```

---

## 4. DATABASE SCHEMA (PostgreSQL)

```sql
-- Users & Auth
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'customer', -- 'admin' or 'customer'
  facility_id UUID REFERENCES facilities(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Storage Facilities (e.g., Carl's Wine Vault)
CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  capacity_cases INT,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Customer Collections (wine owned by customers, stored at facility)
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES users(id) NOT NULL,
  facility_id UUID REFERENCES facilities(id) NOT NULL,
  name VARCHAR(255),
  total_cases INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Individual Wines
CREATE TABLE wines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES collections(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  vintage INT,
  region VARCHAR(255),
  varietal VARCHAR(255),
  quantity INT,
  location_code VARCHAR(50), -- e.g., "A-12-3"
  notes TEXT,
  estimated_value DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Climate Sensors
CREATE TABLE climate_sensors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES facilities(id) NOT NULL,
  sensor_name VARCHAR(255),
  sensor_type VARCHAR(50), -- 'temperature', 'humidity'
  api_key VARCHAR(255),
  location VARCHAR(255),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Climate Readings
CREATE TABLE climate_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id UUID REFERENCES climate_sensors(id) NOT NULL,
  temperature DECIMAL(5,2),
  humidity DECIMAL(5,2),
  timestamp TIMESTAMP DEFAULT NOW(),
  alert_triggered BOOLEAN DEFAULT FALSE
);

-- Alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES facilities(id),
  alert_type VARCHAR(100), -- 'temperature_high', 'humidity_low', etc.
  severity VARCHAR(50), -- 'info', 'warning', 'critical'
  message TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);
```

---

## 5. CORE FEATURES (MVP)

### Phase 1: Foundation (Week 1-2)
- [ ] User authentication (login, signup, password reset)
- [ ] Role-based access (admin vs. customer)
- [ ] Basic inventory (add wine, view collection, edit/delete)
- [ ] Customer portal (view own collection only)
- [ ] Admin dashboard (see all collections, customers)

### Phase 2: Climate Monitoring (Week 2-3)
- [ ] Connect IoT sensors (temperature/humidity)
- [ ] Real-time climate display
- [ ] Alert system (high temp, low humidity, etc.)
- [ ] Alert notifications (email + in-app)

### Phase 3: Intelligence (Week 3-4)
- [ ] Wine valuation estimates (API integration)
- [ ] Search & filter inventory
- [ ] Reports (inventory by region, value, etc.)
- [ ] Export collections (CSV, PDF)

---

## 6. API ENDPOINTS (Backend)

### Authentication
- `POST /api/auth/signup` — Register new user
- `POST /api/auth/login` — Login, return JWT
- `POST /api/auth/logout` — Clear session
- `POST /api/auth/refresh` — Refresh JWT

### Inventory
- `GET /api/inventory` — List wines (filtered by role)
- `POST /api/inventory` — Add wine
- `GET /api/inventory/:id` — Get single wine
- `PATCH /api/inventory/:id` — Update wine
- `DELETE /api/inventory/:id` — Delete wine
- `GET /api/collections` — List all collections
- `POST /api/collections` — Create collection

### Climate
- `GET /api/climate/readings` — Last 24h readings
- `GET /api/climate/readings/:sensorId` — Single sensor history
- `POST /api/climate/alerts` — List active alerts
- `PATCH /api/climate/alerts/:id` — Mark alert resolved

### Customers (Admin only)
- `GET /api/customers` — List all customers
- `POST /api/customers` — Create customer
- `GET /api/customers/:id` — Get customer profile
- `PATCH /api/customers/:id` — Update customer

### Reports
- `GET /api/reports/inventory` — Inventory summary
- `GET /api/reports/value` — Total collection value
- `GET /api/reports/climate` — Climate history & trends

---

## 7. FRONTEND PAGES

| Page | User | Purpose |
|------|------|---------|
| `/login` | All | Authentication |
| `/signup` | All | Registration |
| `/dashboard` | Admin | Overview, KPIs, alerts |
| `/dashboard` | Customer | My collection, climate |
| `/inventory` | Admin | All wines, manage |
| `/inventory` | Customer | My wines only |
| `/climate` | Admin | Sensor readings, alerts |
| `/customers` | Admin | Customer list, manage |
| `/settings` | All | Profile, preferences |

---

## 8. DEPLOYMENT

### Frontend (Vercel)
1. Push to GitHub repo
2. Vercel auto-deploys on push to `main`
3. Built-in preview deploys for PRs
4. Environment variables: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SUPABASE_KEY

### Backend (Supabase + Node.js)
1. API runs on Supabase Edge Functions (serverless)
2. Push code to GitHub
3. Deploy via GitHub Actions → Supabase

### Database (Supabase PostgreSQL)
1. Schema migrations stored in `/database/migrations/`
2. Run migrations via Supabase CLI
3. Backups automated daily

---

## 9. WHAT I NEED FROM YOU

### 1. GitHub Access
- [ ] Create repo: `oenivault-ai` under BuildTronixAI org
- [ ] Give me write access (or you push initial structure)
- [ ] Share repo URL

### 2. Supabase Setup
- [ ] Confirm Supabase project is live (fix DNS issue if needed)
- [ ] Provide Supabase URL and API key
- [ ] Create schema from `/database/schema.sql`

### 3. Vercel Setup
- [ ] Confirm Vercel project for `oenivault.ai`
- [ ] Provide Vercel token (if deploying via CLI)
- [ ] Environment variables ready

### 4. Feature Prioritization (Confirm)
- [ ] Phase 1 only for MVP? (weeks 1-2)
- [ ] Or go full phase 1-3? (weeks 1-4)

### 5. Cursor Setup
- [ ] Share your machine SSH or workspace path
- [ ] I'll write code directly to `/oenivault-ai/`
- [ ] You see live in Cursor, test, iterate

---

## 10. NEXT STEPS (In Order)

1. **You:** Confirm Supabase, Vercel, GitHub are ready
2. **You:** Give me SSH/Cursor access to write files
3. **Me:** Initialize repo with folder structure + schema
4. **Me:** Build Phase 1 (auth, inventory, basic dashboard)
5. **You:** Review in Cursor, test locally
6. **Me:** Phase 2 (climate monitoring)
7. **You:** Test, iterate
8. **Deploy:** Live on Vercel + Supabase

---

## 11. SUCCESS CRITERIA

**MVP Launch Ready When:**
- [ ] Users can signup/login (JWT auth working)
- [ ] Admin can add customers & collections
- [ ] Admin can manage wine inventory
- [ ] Customers can view their collection
- [ ] Admin sees all collections + customers
- [ ] Climate alerts display in real-time
- [ ] Code deployed live on Vercel + Supabase
- [ ] No console errors, responsive on mobile

---

## 12. QUESTIONS FOR YOU

Before I start building, confirm:

1. **Audience:** Facility operators + collectors, or just one?
2. **MVP Timeline:** 2 weeks (Phase 1 only) or 4 weeks (full)?
3. **API Integration:** Wine database (Vivino, etc.)? Or manual entry only?
4. **Branding:** Use existing OeniVault colors/logo?
5. **Payments:** Subscription model? Or free MVP first?

---

## BUILD INSTRUCTIONS FOR CURSOR

Once you confirm the above, do this:

1. **Open Cursor**
2. **Clone or init repo:**
   ```bash
   git clone <repo-url> oenivault-ai
   cd oenivault-ai
   ```
3. **SSH into your machine (from Cursor terminal)**
4. **I'll push the initial structure** via SSH:
   - Folder structure
   - package.json (dependencies)
   - tsconfig.json
   - Database schema
   - README.md

5. **You confirm in Cursor:**
   - Run `npm install` in `/frontend` and `/backend`
   - Check folder structure
   - Review schema

6. **I'll start building Phase 1** directly to your machine via SSH
7. **You see live changes** in Cursor
8. **You test/iterate** as I build

---

**Ready to build. Waiting for your confirmation above.**
