# 🏸 String Service Platform

**Badminton Stringing Service Management System** | 羽毛球穿线服务管理平台

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.0-black?style=for-the-badge&logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma" alt="Prisma"/>
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Tailwind-3.4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production%20Ready-success?style=flat-square" alt="Status"/>
  <img src="https://img.shields.io/badge/Tests-Vitest-yellow?style=flat-square&logo=vitest" alt="Tests"/>
</p>

---

## 📖 Overview

A comprehensive digital management system for professional badminton stringing services. Digitizes the entire workflow from customer booking to inventory management and financial analysis.

| For Customers | For Stringers |
|---------------|---------------|
| Seamless booking experience | Automated inventory deduction |
| Online payment with proof upload | Real-time profit calculation |
| Real-time order tracking | Order lifecycle management |
| Points & referral rewards | Business analytics dashboard |

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18+ |
| Docker | Latest |
| npm/pnpm | 9+ |

### Installation

```bash
# Clone and install
git clone <repository-url>
cd string
npm install

# Environment setup
cp .env.example .env
# Edit .env with your DATABASE_URL and NEXTAUTH_SECRET
```

### Environment Variables

Create a `.env` file with the following:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/string_db"

# Auth (generate secret: openssl rand -base64 32)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Optional: Image upload path
UPLOAD_DIR="./public/uploads"
```

### Start Development

```bash
# Start PostgreSQL
docker-compose up -d

# Initialize database
npm run db:push
npm run db:seed

# Start dev server
npm run dev
```

Visit **http://localhost:3000**

### First-Time Admin Setup

```sql
-- Promote a user to admin
UPDATE "User" SET role = 'admin' WHERE email = 'your@email.com';
```

---

## ✨ Features

### 👤 User Features

| Feature | Description |
|---------|-------------|
| **Smart Booking** | Select string model, tension, time slot |
| **Multi-Racket Orders** | Book multiple rackets with independent specs |
| **TNG Payment** | QR code payment with proof upload |
| **Package System** | Pre-paid session bundles with auto-deduction |
| **Points & Rewards** | Earn points from spending, referrals, sign-up |
| **Referral Program** | Share codes, both parties earn rewards |
| **Voucher Redemption** | Exchange points for discount vouchers |
| **Order Tracking** | Real-time status: Received → Stringing → Ready → Picked Up |

### 🛡️ Admin Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Revenue metrics, active orders, pending tasks |
| **Order Management** | Timeline view, status notes, lifecycle tracking |
| **Payment Verification** | Review proofs, approve/reject payments |
| **Inventory Control** | Stock levels, low-stock alerts, restock suggestions |
| **User Management** | View users, adjust roles, manage points |
| **Package/Voucher Management** | Create, edit, activate promotions |
| **Analytics** | Revenue reports, order trends, top strings |

### 🔒 Security

- **Rate Limiting** — API protection for auth routes
- **Health Checks** — `/api/health` endpoint for monitoring
- **Error Boundaries** — Global error handling
- **Type Safety** — End-to-end TypeScript with Prisma

---

## 🏗️ Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
├─────────────────────────────────────────────────────────────┤
│  Next.js 14 (App Router) • React 18 • TypeScript            │
│  Tailwind CSS • Framer Motion • Lucide Icons                │
│  NextAuth.js v5 (Beta) • React Hot Toast                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                              │
├─────────────────────────────────────────────────────────────┤
│  Next.js API Routes • Prisma ORM 6.19                       │
│  PostgreSQL 15 • Sharp (Image Processing)                   │
│  Zod (Validation) • bcrypt (Password Hashing)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     INFRASTRUCTURE                          │
├─────────────────────────────────────────────────────────────┤
│  Docker • Local File Storage • Vitest (Testing)             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
string/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (user)/             # User routes (booking, profile)
│   │   ├── admin/              # Admin dashboard
│   │   └── api/                # API Route Handlers (114 routes)
│   ├── components/             # Reusable UI components (85+)
│   ├── features/               # Feature modules (50+ components)
│   │   ├── booking/            # Booking flow
│   │   ├── landing/            # Landing page
│   │   ├── profile/            # User profile
│   │   └── ...
│   ├── lib/                    # Utilities (Auth, Prisma, Helpers)
│   ├── services/               # Business logic layer (27 services)
│   └── types/                  # TypeScript definitions
├── prisma/
│   ├── schema.prisma           # Database Schema (25 Models)
│   └── seed.ts                 # Database Seeder
├── docs/                       # Documentation (100+ files)
│   ├── core/                   # System Design, API Spec, ERD
│   ├── status/                 # Project Status
│   ├── guides/                 # Deployment & Testing Guides
│   └── changelogs/             # Change Logs (100+)
└── public/                     # Static Assets
```

---

## 📦 Database Models

| Model | Description |
|-------|-------------|
| `User` | User accounts with roles (user/admin) |
| `Order` | Stringing orders with multi-item support |
| `Payment` | Payment records with proof images |
| `StringInventory` | String stock with cost/price tracking |
| `Package` | Pre-paid service bundles |
| `UserPackage` | User's purchased packages |
| `Voucher` | Discount vouchers |
| `UserVoucher` | User's redeemed vouchers |
| `PointsLog` | Points transaction history |
| `ReferralLog` | Referral tracking |
| `StockLog` | Inventory change audit |
| `Notification` | User notifications |
| `SystemSetting` | System configuration |

---

## 🧪 Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # TypeScript check

# Database
npm run db:push          # Push schema to database
npm run db:seed          # Seed initial data
npm run db:studio        # Open Prisma Studio
npm run db:generate      # Generate Prisma client

# Testing
npm test                 # Run tests in watch mode
npm run test:run         # Run tests once
npm run test:coverage    # Run with coverage
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [System Design](docs/core/System-Design-Document.md) | Architecture & data flow |
| [API Specification](docs/core/api_spec.md) | Endpoint documentation |
| [Database ERD](docs/core/erd.md) | Entity relationships |
| [Project Status](docs/status/PROJECT_STATUS.md) | Completion status & roadmap |
| [Deployment Guide](docs/guides/DEPLOYMENT_CHECKLIST.md) | Production checklist |

---

## 📊 Project Status

| Module | Status |
|--------|--------|
| Backend Infrastructure | ✅ Complete |
| Database Design | ✅ Complete |
| API Routes | ✅ Complete |
| Authentication | ✅ Complete |
| User Interface | ✅ Complete |
| Admin Dashboard | ✅ Complete |
| Testing | ⚠️ In Progress |
| Deployment | ⚠️ In Progress |

### Recent Updates (Jan 2026)

- Profit Analysis in Restock Suggestions
- Order Status Notes & Timeline View
- Production hardening (Rate limits, Health checks)
- Multi-racket booking support

---

## 🤝 Contributing

1. Read [CLAUDE.md](CLAUDE.md) for development protocol
2. Follow the coding standards and design system
3. Include changelog entries in `docs/changelogs/`
4. Ensure TypeScript types are complete
5. Write tests for new features

---

## 📄 License

MIT License

---

<p align="center">
  <sub>Built with ❤️ for badminton enthusiasts</sub>
</p>