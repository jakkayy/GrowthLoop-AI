# Auto Post — Social Media Automation Platform

ระบบจัดการและกำหนดเวลาโพสต์โซเชียลมีเดียอัตโนมัติ รองรับ Facebook และ LINE พร้อม AI สร้าง Caption และรูปภาพ

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, TypeScript |
| Backend | NestJS 11, TypeScript |
| Database / Storage | Supabase (PostgreSQL + Storage) |
| AI | OpenRouter API (Caption & Image Generation) |
| Scheduling | NestJS Schedule (cron-based) |

## Features

- **AI Caption Generator** — สร้าง Caption สำหรับ Facebook/Instagram ตามข้อมูลแบรนด์และเป้าหมาย
- **AI Image Generator** — สร้างรูปภาพ Reference สำหรับโพสต์ผ่าน OpenRouter
- **Facebook Integration** — โพสต์อัตโนมัติผ่าน Facebook Graph API, ดู Page Insights
- **LINE Integration** — ส่ง Flex Message แจ้งเตือนผ่าน LINE
- **Scheduler** — กำหนดเวลาโพสต์ล่วงหน้า ระบบจะโพสต์ให้อัตโนมัติตามเวลาที่ตั้งไว้
- **Competitor Analysis** — ติดตามและวิเคราะห์คู่แข่ง
- **Draft Management** — บันทึกและจัดการ Draft โพสต์ก่อนเผยแพร่
- **Multi-user** — ระบบ Auth ด้วย JWT + Supabase รองรับหลาย Account

## Project Structure

```
next_nest/
├── backend/          # NestJS API Server (port 3001)
│   └── src/
│       ├── ai/           # AI caption & image generation
│       ├── content/      # Content management
│       ├── drafts/       # Draft posts
│       ├── facebook/     # Facebook Graph API integration
│       ├── line/         # LINE Messaging API
│       ├── scheduler/    # Cron job scheduler
│       ├── competitors/  # Competitor tracking
│       └── storage/      # Supabase Storage
└── frontend/         # Next.js App (port 3000, HTTPS)
    └── app/
        ├── dashboard/    # Main dashboard (schedule, insights, AI generate)
        ├── platform/     # Platform connection (Facebook, LINE)
        ├── admin/        # Admin panel
        ├── login/        # Authentication
        └── register/     # User registration
```

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase project (database + storage)
- OpenRouter API key
- Facebook App (Graph API)
- LINE Messaging API channel

### Backend

```bash
cd backend
npm install
cp .env.example .env   # กรอก environment variables
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # กรอก environment variables
npm run dev                  # รันด้วย HTTPS (--experimental-https)
```

### Environment Variables

**Backend (`backend/.env`)**

```env
PORT=3001
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=
OPENROUTER_CAPTION_MODEL=
OPENROUTER_IMAGE_MODEL=
```

**Frontend (`frontend/.env.local`)**

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
BACKEND_URL=http://localhost:3001
JWT_SECRET=
```

## Development

```bash
# Backend — watch mode
cd backend && npm run start:dev

# Frontend — HTTPS dev server
cd frontend && npm run dev

# Run tests (backend)
cd backend && npm run test

# Lint & format
npm run lint
npm run format
```
