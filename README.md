# Growthloop AI

แพลตฟอร์ม AI Marketing อัตโนมัติสำหรับธุรกิจ SME ในประเทศไทย — สร้างคอนเทนต์, วิเคราะห์คู่แข่ง, และโพสต์อัตโนมัติไปยัง Facebook และ LINE ด้วยพลัง AI

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, TypeScript |
| Backend | NestJS 11, TypeScript |
| Database / Storage | Supabase (PostgreSQL + Object Storage) |
| AI | OpenRouter API — GPT-4.1 Mini (caption) + Gemini Flash (image) |
| Scheduler | NestJS Schedule (cron ทุกนาที) |
| Social APIs | Facebook Graph API v25, LINE Messaging API |
| Competitor Scraping | Apify API |

---

## Features

### AI Content Generation
- สร้าง Caption อัตโนมัติตาม brand tone, target audience, และข้อมูลคู่แข่ง
- สร้างรูปภาพโปรโมตด้วย Gemini Image Generation พร้อม reference images ของแบรนด์
- กำหนด system prompt และ image prefix แบบ per-user ได้

### Approval Workflow ผ่าน LINE
- ระบบส่ง Flex Message แสดง caption + ภาพตัวอย่างให้ user อนุมัติผ่าน LINE
- กด "อนุมัติ" → โพสต์ขึ้น Facebook อัตโนมัติตามเวลาที่ตั้ง
- กด "ปฏิเสธ" → draft ถูกยกเลิก | ไม่ตอบภายใน 2 ชั่วโมง → หมดเวลาอัตโนมัติ

### Scheduler
- ตั้งเวลา generate, post, และส่งรายงาน engagement ได้แบบรายวัน
- Cron job ตรวจทุกนาทีว่าถึงเวลา action ของ user แต่ละรายหรือไม่

### Competitor Analysis
- เพิ่ม Facebook Page คู่แข่ง → ดึงโพสต์และ comment 7 วันล่าสุดด้วย Apify
- AI สรุปเป็น insight และใส่เข้า prompt การสร้างคอนเทนต์อัตโนมัติ

### Own Page Performance
- ดึงข้อมูล engagement (likes, comments, shares) จาก Facebook Page ของตัวเอง
- AI วิเคราะห์และให้แนวทางปรับปรุงคอนเทนต์

### Auto-Comment
- ตอบ comment อัตโนมัติบน Facebook โดย AI สร้าง reply ตาม brand voice

---

## Architecture

```
Growthloop AI/
├── backend/          # NestJS API Server — port 3001
│   └── src/
│       ├── ai/           # OpenRouter integration (caption & image)
│       ├── content/      # Content generation pipeline
│       ├── drafts/       # Draft lifecycle management
│       ├── facebook/     # Facebook Graph API, webhooks, insights
│       ├── line/         # LINE Messaging API, flex messages, webhooks
│       ├── scheduler/    # Cron-based auto-generate / auto-post
│       ├── competitors/  # Apify scraping + AI analysis
│       └── storage/      # Supabase Storage (image upload)
│
└── frontend/         # Next.js App — port 3000 (HTTPS)
    └── app/
        ├── dashboard/        # Main dashboard
        │   ├── ScheduleForm          # ตั้งเวลา auto tasks
        │   ├── CompetitorsSection    # จัดการและ scrape คู่แข่ง
        │   ├── OwnPageInsightsSection
        │   ├── ReferenceImages       # อัปโหลดรูปอ้างอิงสินค้า
        │   └── subscription/         # เลือก plan
        ├── platform/         # เชื่อมต่อ LINE / Facebook
        ├── admin/            # Admin panel จัดการ clients
        ├── login/
        └── register/
```

### Draft State Machine

```
generate_time
    ↓
[AI generates content]
    ↓
PENDING → SENT (LINE Flex Message ส่งให้ user)
              ↓
         APPROVED → POST (Facebook) → POSTED
         DENIED
         ไม่ตอบ 2 ชั่วโมง → EXPIRED
```

---

## Database Schema (Supabase)

| Table | คำอธิบาย |
|---|---|
| `users` | ข้อมูล user, brand profile, schedule times, custom prompts |
| `post_drafts` | Draft โพสต์พร้อม status lifecycle |
| `product_groups` | กลุ่มสินค้าสำหรับ reference images |
| `reference_images` | รูปอ้างอิงสำหรับ AI image generation |
| `line_connections` | LINE account ที่เชื่อมต่อ |
| `facebook_pages` | Facebook Page + access token |
| `competitors` | เพจคู่แข่งที่ติดตาม |
| `competitor_posts` | โพสต์ที่ scrape มา |
| `competitor_insights` | AI insight จากคู่แข่ง |
| `competitor_scrape_jobs` | ประวัติ scrape jobs |
| `own_page_insights` | Engagement analytics ของเพจตัวเอง |
| `replied_comments` | ติดตาม comment ที่ตอบแล้ว |

---

## Getting Started

### Prerequisites

- Node.js ≥ 20.9
- Supabase project (PostgreSQL + Storage bucket `image-post`)
- OpenRouter API key
- Facebook App (Graph API, Webhooks)
- LINE Messaging API channel + LINE Login channel
- Apify API key (สำหรับ competitor scraping)
- ngrok หรือ public URL สำหรับ webhooks (dev)

### Installation

**Backend**

```bash
cd backend
npm install
cp .env.example .env
# แก้ไข .env ตาม environment ของคุณ
npm run start:dev
```

**Frontend**

```bash
cd frontend
npm install
cp .env.example .env.local
# แก้ไข .env.local ตาม environment ของคุณ
npm run dev
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=3001

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=image-post

# OpenRouter (AI)
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_CAPTION_MODEL=openai/gpt-4.1-mini
OPENROUTER_IMAGE_MODEL=google/gemini-2.0-flash-exp:free

# Facebook
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_API_VERSION=v25.0
FACEBOOK_VERIFY_TOKEN=   # random string สำหรับ webhook verification

# LINE
LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=

# Apify (competitor scraping)
APIFY_API_KEY=

# URLs
BASE_URL=http://localhost:3001
NGROK_HTTP=https://xxxx.ngrok.io   # สำหรับ webhook dev
```

### Frontend (`frontend/.env.local`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Auth
JWT_SECRET=    # ต้องตรงกับ backend ถ้ามี JWT shared

# Facebook OAuth
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_REDIRECT_URI=https://localhost:3000/api/facebook/callback
FACEBOOK_API_VERSION=v25.0

# LINE Login
LINE_CLIENT_ID=
LINE_CLIENT_SECRET=
LINE_REDIRECT_URI=https://localhost:3000/api/line/callback
LINE_LOGIN_CHANNEL_SECRET=

# Internal
NEXT_PUBLIC_APP_URL=https://localhost:3000
BACKEND_URL=http://localhost:3001
```

---

## Development Scripts

```bash
# Backend
cd backend
npm run start:dev    # watch mode
npm run build        # production build
npm run start:prod   # run production
npm run test         # unit tests
npm run lint         # ESLint + fix
npm run format       # Prettier

# Frontend
cd frontend
npm run dev          # HTTPS dev server (webpack)
npm run build        # production build
npm run start        # run production
npm run lint         # ESLint
```

---

## Webhook Setup (Development)

Facebook และ LINE ต้องการ HTTPS URL สาธารณะสำหรับ webhook ในระหว่าง development:

```bash
# ติดตั้ง ngrok แล้วรัน tunnel ไปยัง backend
ngrok http 3001

# ใส่ URL ที่ได้ใน .env
NGROK_HTTP=https://xxxx.ngrok.io

# ตั้งค่า Webhook URL ใน:
# - Facebook Developer Console → Webhooks → https://xxxx.ngrok.io/facebook/webhook
# - LINE Developers Console → Webhook URL → https://xxxx.ngrok.io/line/webhook
```
