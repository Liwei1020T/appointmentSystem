# 🗄️ Entity Relationship Diagram (ERD)

**String Service Platform — Database Schema**  
**Version:** 1.1  
**Last Updated:** 2025-12-23  
**Database:** PostgreSQL (Supabase)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [ERD Diagram](#erd-diagram)
3. [Table Definitions](#table-definitions)
4. [Relationships](#relationships)
5. [Indexes](#indexes)
6. [RLS Policies](#rls-policies)
7. [Triggers & Functions](#triggers--functions)

---

## Overview

This database schema supports the complete String Service Platform, including:

- User authentication and profiles
- Booking and order management
- **Multi-racket order support** (2025-12-23 新增)
- Payment processing
- Package (套餐) system
- Inventory management
- Points and voucher system
- Referral program
- Notifications and analytics

**Total Tables:** 15 core tables + system tables

---

## ERD Diagram

```text
┌─────────────┐          ┌──────────────┐          ┌─────────────────┐
│    users    │──1:N────▶│    orders    │──N:1────▶│string_inventory │
└─────────────┘          └──────────────┘          └─────────────────┘
      │                         │                            │
      │                         │                            │
      │1:N                      │N:1                         │1:N
      ▼                         ▼                            ▼
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│user_packages │          │   payments   │          │  stock_logs  │
└──────────────┘          └──────────────┘          └──────────────┘
      │N:1                                                   
      ▼                                                      
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│   packages   │          │   vouchers   │          │  points_log  │
└──────────────┘          └──────────────┘          └──────────────┘
                                 │1:N                       │N:1
                                 ▼                          │
                          ┌──────────────┐                 │
                          │user_vouchers │◀────────────────┘
                          └──────────────┘
                                 
┌──────────────┐          ┌──────────────┐
│referral_logs │          │notifications │
└──────────────┘          └──────────────┘
```

---

## Table Definitions

### 1. `users`

Extends Supabase Auth with business profile data.

| Column          | Type         | Constraints              | Description                    |
|-----------------|--------------|--------------------------|--------------------------------|
| `id`            | `uuid`       | PRIMARY KEY              | User ID (from Supabase Auth)   |
| `email`         | `text`       | UNIQUE, NULLABLE         | Email address (legacy / optional) |
| `phone`         | `text`       | UNIQUE                   | Phone number (used for OTP login) |
| `full_name`     | `text`       |                          | Full name                      |
| `address`       | `text`       |                          | Address (optional)             |
| `avatar_url`    | `text`       |                          | Avatar image URL (optional)    |
| `referral_code` | `text`       | UNIQUE, NOT NULL         | User's unique 6-digit referral code |
| `referred_by`   | `text`       | FK → users.referral_code | Referrer's code                |
| `points`        | `integer`    | DEFAULT 0                | Current points balance         |
| `role`          | `text`       | DEFAULT 'customer'       | 'customer' or 'admin'          |
| `created_at`    | `timestamptz`| DEFAULT now()            | Registration timestamp         |
| `updated_at`    | `timestamptz`| DEFAULT now()            | Last update timestamp          |

**Indexes:**
- `idx_users_referral_code` on `referral_code`
- `idx_users_referred_by` on `referred_by`
- `idx_users_email` on `email`

---

### 1.1 `otp_codes` (Phone OTP)

Stores hashed OTP codes for **password reset**. Plain OTP codes are **never** stored.

| Column          | Type         | Constraints                 | Description                       |
|-----------------|--------------|-----------------------------|-----------------------------------|
| `id`            | `uuid`       | PRIMARY KEY                 | OTP record ID                     |
| `phone`         | `text`       | NOT NULL                    | Canonical phone digits (e.g. 60...) |
| `purpose`       | `text`       | NOT NULL                    | Purpose (e.g. `password_reset`)   |
| `code_hash`     | `text`       | NOT NULL                    | Hashed OTP code                   |
| `attempts`      | `int`        | DEFAULT 0                   | Wrong attempts count              |
| `max_attempts`  | `int`        | DEFAULT 5                   | Max attempts before invalidation  |
| `expires_at`    | `timestamptz`| NOT NULL                    | Expiration time                   |
| `created_at`    | `timestamptz`| DEFAULT now()               | Created time                      |
| `updated_at`    | `timestamptz`| DEFAULT now()               | Updated time                      |

**Constraints & Indexes:**
- UNIQUE(`phone`, `purpose`) — only one active OTP per phone/purpose
- `idx_otp_codes_expires_at` on `expires_at`
- `idx_otp_codes_created_at` on `created_at`

---

### 2. `string_inventory`

Ball string inventory management.

| Column          | Type         | Constraints              | Description                    |
|-----------------|--------------|--------------------------|--------------------------------|
| `id`            | `uuid`       | PRIMARY KEY              | Inventory item ID              |
| `model`         | `text`       | NOT NULL                 | String model (e.g., "BG66UM")  |
| `brand`         | `text`       | NOT NULL                 | Brand (e.g., "YONEX")          |
| `cost_price`    | `numeric`    | NOT NULL                 | Cost price per unit (RM)       |
| `selling_price` | `numeric`    | NOT NULL                 | Selling price (RM)             |
| `stock`         | `integer`    | DEFAULT 0                | Current stock quantity         |
| `minimum_stock` | `integer`    | DEFAULT 5                | Minimum stock alert threshold  |
| `color`         | `text`       |                          | String color                   |
| `gauge`         | `text`       |                          | String gauge (e.g., "0.70mm")  |
| `description`   | `text`       |                          | String description / notes     |
| `image_url`     | `text`       |                          | Product image URL              |
| `active`        | `boolean`    | DEFAULT true             | Whether visible to customers   |
| `created_at`    | `timestamptz`| DEFAULT now()            |                                |
| `updated_at`    | `timestamptz`| DEFAULT now()            |                                |

**Indexes:**
- `idx_string_inventory_active` on `active`
- `idx_string_inventory_brand_model` on `(brand, model)`

---

### 3. `orders`

Customer booking and order records.

| Column          | Type         | Constraints              | Description                           |
|-----------------|--------------|--------------------------|---------------------------------------|
| `id`            | `uuid`       | PRIMARY KEY              | Order ID                              |
| `user_id`       | `uuid`       | FK → users.id, NOT NULL  | Customer ID                           |
| `string_id`     | `uuid`       | FK → string_inventory.id | String used                           |
| `tension`       | `integer`    |                          | String tension (lbs)                  |
| `price`         | `numeric`    | NOT NULL                 | Final price paid                      |
| `cost`          | `numeric`    |                          | Cost of string used                   |
| `profit`        | `numeric`    |                          | Calculated profit (price - cost)      |
| `discount`      | `numeric`    | DEFAULT 0                | Discount applied                      |
| `status`        | `text`       | NOT NULL                 | 'pending', 'in_progress', 'completed' |
| `use_package`   | `boolean`    | DEFAULT false            | Whether used package deduction        |
| `package_used_id`| `uuid`      | FK → user_packages.id    | Package record if used                |
| `voucher_used_id`| `uuid`      | FK → user_vouchers.id    | Voucher used                          |
| `notes`         | `text`       |                          | Customer notes                        |
| `completed_at`  | `timestamptz`|                          | Completion timestamp                  |
| `created_at`    | `timestamptz`| DEFAULT now()            | Order creation time                   |
| `updated_at`    | `timestamptz`| DEFAULT now()            |                                       |

**Indexes:**
- `idx_orders_user_id` on `user_id`
- `idx_orders_status` on `status`
- `idx_orders_created_at` on `created_at DESC`

---

### 3.1 `order_items` (多球拍订单项) — 2025-12-23 新增

Multi-racket order items. Each item represents one racket within a multi-racket order.

| Column             | Type         | Constraints              | Description                           |
|--------------------|--------------|--------------------------|---------------------------------------|
| `id`               | `uuid`       | PRIMARY KEY              | Item ID                               |
| `order_id`         | `uuid`       | FK → orders.id, NOT NULL | Parent order                          |
| `string_id`        | `uuid`       | FK → string_inventory.id | String used for this racket           |
| `tension_vertical` | `integer`    | NOT NULL                 | Vertical string tension (lbs)         |
| `tension_horizontal`| `integer`   | NOT NULL                 | Horizontal string tension (lbs)       |
| `racket_brand`     | `text`       |                          | Racket brand (optional)               |
| `racket_model`     | `text`       |                          | Racket model (optional)               |
| `racket_photo`     | `text`       | NOT NULL                 | Racket photo URL (required)           |
| `notes`            | `text`       |                          | Special notes for this racket         |
| `price`            | `numeric`    | NOT NULL                 | Price for this racket string service  |
| `created_at`       | `timestamptz`| DEFAULT now()            | Creation time                         |
| `updated_at`       | `timestamptz`| DEFAULT now()            |                                       |

**Indexes:**
- `idx_order_items_order_id` on `order_id`

**Notes:**
- Multi-racket orders have `string_id = NULL` in the parent `orders` table
- Each item references its own string in `string_inventory`
- `racket_photo` is required - enforced at application level
- Cascade delete: deleting parent order deletes all items

---

### 4. `payments`

Payment transaction records.

| Column          | Type         | Constraints              | Description                           |
|-----------------|--------------|--------------------------|---------------------------------------|
| `id`            | `uuid`       | PRIMARY KEY              | Payment ID                            |
| `order_id`      | `uuid`       | FK → orders.id           | Related order (nullable)              |
| `package_id`    | `uuid`       | FK → packages.id         | Related package purchase (nullable)   |
| `user_id`       | `uuid`       | FK → users.id, NOT NULL  | Payer                                 |
| `amount`        | `numeric`    | NOT NULL                 | Payment amount                        |
| `provider`      | `text`       | NOT NULL                 | 'fpx', 'tng', 'stripe', 'card'        |
| `status`        | `text`       | NOT NULL                 | 'pending', 'success', 'failed', 'refunded' |
| `transaction_id`| `text`       | UNIQUE                   | External payment gateway ID           |
| `metadata`      | `jsonb`      |                          | Additional payment data               |
| `created_at`    | `timestamptz`| DEFAULT now()            |                                       |
| `updated_at`    | `timestamptz`| DEFAULT now()            |                                       |

**Indexes:**
- `idx_payments_user_id` on `user_id`
- `idx_payments_status` on `status`
- `idx_payments_transaction_id` on `transaction_id`

---

### 5. `packages`

Package (套餐) definitions.

| Column          | Type         | Constraints              | Description                    |
|-----------------|--------------|--------------------------|--------------------------------|
| `id`            | `uuid`       | PRIMARY KEY              | Package ID                     |
| `name`          | `text`       | NOT NULL                 | Package name (e.g., "5次穿线") |
| `description`   | `text`       |                          | Package description            |
| `times`         | `integer`    | NOT NULL                 | Number of sessions included    |
| `price`         | `numeric`    | NOT NULL                 | Package price                  |
| `original_price`| `numeric`    |                          | Original price (for comparison)|
| `validity_days` | `integer`    | NOT NULL                 | Validity period in days        |
| `active`        | `boolean`    | DEFAULT true             | Whether available for purchase |
| `image_url`     | `text`       |                          | Package image                  |
| `created_at`    | `timestamptz`| DEFAULT now()            |                                |
| `updated_at`    | `timestamptz`| DEFAULT now()            |                                |

**Indexes:**
- `idx_packages_active` on `active`

---

### 6. `user_packages`

User's purchased packages.

| Column          | Type         | Constraints              | Description                    |
|-----------------|--------------|--------------------------|--------------------------------|
| `id`            | `uuid`       | PRIMARY KEY              | Record ID                      |
| `user_id`       | `uuid`       | FK → users.id, NOT NULL  | Package owner                  |
| `package_id`    | `uuid`       | FK → packages.id         | Package definition             |
| `remaining`     | `integer`    | NOT NULL                 | Remaining usage count          |
| `original_times`| `integer`    | NOT NULL                 | Original times purchased       |
| `expiry`        | `timestamptz`| NOT NULL                 | Expiry date                    |
| `status`        | `text`       | DEFAULT 'active'         | 'active', 'expired', 'depleted'|
| `created_at`    | `timestamptz`| DEFAULT now()            | Purchase date                  |
| `updated_at`    | `timestamptz`| DEFAULT now()            |                                |

**Indexes:**
- `idx_user_packages_user_id` on `user_id`
- `idx_user_packages_status` on `status`
- `idx_user_packages_expiry` on `expiry`

---

### 7. `vouchers`

Voucher/coupon definitions.

| Column          | Type         | Constraints              | Description                    |
|-----------------|--------------|--------------------------|--------------------------------|
| `id`            | `uuid`       | PRIMARY KEY              | Voucher ID                     |
| `code`          | `text`       | UNIQUE, NOT NULL         | Voucher code (e.g., "SAVE5")   |
| `name`          | `text`       | NOT NULL                 | Display name                   |
| `type`          | `text`       | NOT NULL                 | 'fixed_amount', 'percentage'   |
| `value`         | `numeric`    | NOT NULL                 | Discount value (RM or %)       |
| `min_purchase`  | `numeric`    | DEFAULT 0                | Minimum purchase requirement   |
| `max_uses`      | `integer`    |                          | Maximum total uses (null = unlimited) |
| `used_count`    | `integer`    | DEFAULT 0                | Current usage count            |
| `points_cost`   | `integer`    | DEFAULT 0                | Points required to redeem      |
| `max_redemptions_per_user` | `integer` | DEFAULT 1         | 每用户最大兑换次数 (2025-12-23 新增) |
| `valid_from`    | `timestamptz`| NOT NULL                 | Start date                     |
| `valid_until`   | `timestamptz`| NOT NULL                 | End date                       |
| `active`        | `boolean`    | DEFAULT true             | Whether active                 |
| `created_at`    | `timestamptz`| DEFAULT now()            |                                |

**Indexes:**
- `idx_vouchers_code` on `code`
- `idx_vouchers_active` on `active`

---

### 8. `user_vouchers`

User's owned vouchers.

| Column          | Type         | Constraints              | Description                    |
|-----------------|--------------|--------------------------|--------------------------------|
| `id`            | `uuid`       | PRIMARY KEY              | Record ID                      |
| `user_id`       | `uuid`       | FK → users.id, NOT NULL  | Voucher owner                  |
| `voucher_id`    | `uuid`       | FK → vouchers.id         | Voucher definition             |
| `status`        | `text`       | DEFAULT 'active'         | 'active', 'used', 'expired'    |
| `used_at`       | `timestamptz`|                          | Usage timestamp                |
| `order_id`      | `uuid`       | FK → orders.id           | Order where used               |
| `expiry`        | `timestamptz`| NOT NULL                 | Expiry date                    |
| `created_at`    | `timestamptz`| DEFAULT now()            | Acquired date                  |

**Indexes:**
- `idx_user_vouchers_user_id` on `user_id`
- `idx_user_vouchers_status` on `status`

---

### 9. `points_log`

Points transaction history.

| Column          | Type         | Constraints              | Description                    |
|-----------------|--------------|--------------------------|--------------------------------|
| `id`            | `uuid`       | PRIMARY KEY              | Log ID                         |
| `user_id`       | `uuid`       | FK → users.id, NOT NULL  | User                           |
| `amount`        | `integer`    | NOT NULL                 | Points change (+/-)            |
| `type`          | `text`       | NOT NULL                 | 'order', 'referral', 'redeem', 'admin_grant' |
| `reference_id`  | `uuid`       |                          | Related record ID              |
| `description`   | `text`       |                          | Description                    |
| `balance_after` | `integer`    | NOT NULL                 | Points balance after change    |
| `created_at`    | `timestamptz`| DEFAULT now()            |                                |

**Indexes:**
- `idx_points_log_user_id` on `user_id`
- `idx_points_log_created_at` on `created_at DESC`

---

### 10. `referral_logs`

Referral relationship tracking.

| Column          | Type         | Constraints              | Description                    |
|-----------------|--------------|--------------------------|--------------------------------|
| `id`            | `uuid`       | PRIMARY KEY              | Log ID                         |
| `referrer_id`   | `uuid`       | FK → users.id, NOT NULL  | Referrer user                  |
| `referred_id`   | `uuid`       | FK → users.id, NOT NULL  | Referred user                  |
| `referral_code` | `text`       | NOT NULL                 | Code used                      |
| `reward_given`  | `boolean`    | DEFAULT false            | Whether reward processed       |
| `created_at`    | `timestamptz`| DEFAULT now()            | Referral timestamp             |

**Indexes:**
- `idx_referral_logs_referrer_id` on `referrer_id`
- `idx_referral_logs_referred_id` on `referred_id`

---

### 11. `stock_logs`

Inventory change history.

| Column          | Type         | Constraints              | Description                    |
|-----------------|--------------|--------------------------|--------------------------------|
| `id`            | `uuid`       | PRIMARY KEY              | Log ID                         |
| `string_id`     | `uuid`       | FK → string_inventory.id | String item                    |
| `change`        | `integer`    | NOT NULL                 | Quantity change (+/-)          |
| `type`          | `text`       | NOT NULL                 | 'restock', 'sale', 'adjustment'|
| `cost_price`    | `numeric`    |                          | Cost price at time of change   |
| `reference_id`  | `uuid`       |                          | Related order/record ID        |
| `notes`         | `text`       |                          | Notes                          |
| `created_by`    | `uuid`       | FK → users.id            | Admin who made change          |
| `created_at`    | `timestamptz`| DEFAULT now()            |                                |

**Indexes:**
- `idx_stock_logs_string_id` on `string_id`
- `idx_stock_logs_created_at` on `created_at DESC`

---

### 12. `notifications`

User notifications.

| Column          | Type         | Constraints              | Description                    |
|-----------------|--------------|--------------------------|--------------------------------|
| `id`            | `uuid`       | PRIMARY KEY              | Notification ID                |
| `user_id`       | `uuid`       | FK → users.id            | Recipient (null = all users)   |
| `title`         | `text`       | NOT NULL                 | Notification title             |
| `message`       | `text`       | NOT NULL                 | Notification body              |
| `type`          | `text`       | NOT NULL                 | 'order', 'package', 'promo', 'system' |
| `read`          | `boolean`    | DEFAULT false            | Read status                    |
| `action_url`    | `text`       |                          | Deep link URL                  |
| `created_at`    | `timestamptz`| DEFAULT now()            |                                |

**Indexes:**
- `idx_notifications_user_id` on `user_id`
- `idx_notifications_read` on `read`

---

### 13. `system_settings`

System-wide configuration.

| Column          | Type         | Constraints              | Description                    |
|-----------------|--------------|--------------------------|--------------------------------|
| `key`           | `text`       | PRIMARY KEY              | Setting key                    |
| `value`         | `jsonb`      | NOT NULL                 | Setting value                  |
| `description`   | `text`       |                          | Setting description            |
| `updated_at`    | `timestamptz`| DEFAULT now()            |                                |

**Example Settings:**
- `referral_reward`: Points for referrer and referee
- `low_stock_threshold`: Global low stock alert
- `sms_enabled`: Enable SMS notifications

---

### 14. `reviews`

Order review records (user feedback after completion).

| Column          | Type         | Constraints              | Description                              |
|-----------------|--------------|--------------------------|------------------------------------------|
| `id`            | `uuid`       | PRIMARY KEY              | Review ID                                |
| `order_id`      | `uuid`       | FK → orders.id           | Related order                            |
| `user_id`       | `uuid`       | FK → users.id            | Reviewer                                 |
| `rating`        | `integer`    | NOT NULL CHECK (1–5)     | Overall rating                           |
| `service_rating`| `integer`    | CHECK (1–5)              | Service rating (optional)                |
| `quality_rating`| `integer`    | CHECK (1–5)              | Quality rating (optional)                |
| `speed_rating`  | `integer`    | CHECK (1–5)              | Speed rating (optional)                  |
| `comment`       | `text`       |                          | Review text                              |
| `photos`        | `text[]`     |                          | Optional review photos                   |
| `tags`          | `text[]`     |                          | Optional tags                            |
| `is_anonymous`  | `boolean`    | DEFAULT false            | Anonymous review flag                    |
| `admin_reply`   | `text`       |                          | Optional admin reply                     |
| `admin_reply_at`| `timestamptz`|                          | Admin reply timestamp                    |
| `admin_reply_by`| `uuid`       | FK → users.id            | Admin who replied                        |
| `created_at`    | `timestamptz`| DEFAULT now()            | Created timestamp                        |
| `updated_at`    | `timestamptz`| DEFAULT now()            | Updated timestamp                        |

**Notes:**
- Review APIs are implemented in Next.js App Router (`/api/reviews/*`) and persist via Prisma; future Supabase/Edge migration should keep payload shape compatible.

---

## Relationships

### User → Orders (1:N)
- One user can have multiple orders
- `orders.user_id` → `users.id`

### User → User Packages (1:N)
- One user can purchase multiple packages
- `user_packages.user_id` → `users.id`

### User → User Vouchers (1:N)
- One user can own multiple vouchers
- `user_vouchers.user_id` → `users.id`

### User → Points Log (1:N)
- One user has multiple points transactions
- `points_log.user_id` → `users.id`

### Orders → String Inventory (N:1)
- Many orders can use the same string
- `orders.string_id` → `string_inventory.id`

### Orders → Payments (1:1 or 1:0)
- One order can have one payment
- `payments.order_id` → `orders.id`

### User Packages → Packages (N:1)
- Many users can purchase the same package
- `user_packages.package_id` → `packages.id`

### User Vouchers → Vouchers (N:1)
- Many users can own the same voucher type
- `user_vouchers.voucher_id` → `vouchers.id`

### Referral (Self-Referencing)
- User can refer other users
- `users.referred_by` → `users.referral_code`

---

## Indexes

**Performance-critical indexes:**

```sql
-- User lookups
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_email ON users(email);

-- Order queries
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Payment tracking
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);

-- Package management
CREATE INDEX idx_user_packages_user_id ON user_packages(user_id);
CREATE INDEX idx_user_packages_status ON user_packages(status);

-- Points and logs
CREATE INDEX idx_points_log_user_id ON points_log(user_id);
CREATE INDEX idx_stock_logs_string_id ON stock_logs(string_id);

-- Notifications
CREATE INDEX idx_notifications_user_id_read ON notifications(user_id, read);
```

---

## RLS Policies

### `users` Table
```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

### `orders` Table
```sql
-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create orders
CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view and update all orders
CREATE POLICY "Admins can manage all orders" ON orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

### `string_inventory` Table
```sql
-- Anyone can view active inventory
CREATE POLICY "Anyone can view active inventory" ON string_inventory
  FOR SELECT USING (active = true);

-- Only admins can modify inventory
CREATE POLICY "Only admins can modify inventory" ON string_inventory
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

### `user_packages` Table
```sql
-- Users can view their own packages
CREATE POLICY "Users can view own packages" ON user_packages
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all packages
CREATE POLICY "Admins can view all packages" ON user_packages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

### `payments` Table
```sql
-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all payments
CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

---

## Triggers & Functions

### 1. Auto-update `updated_at` timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- (Apply to all other tables with updated_at)
```

### 2. Generate unique referral code on user creation

```sql
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.referral_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_user_referral_code BEFORE INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION generate_referral_code();
```

### 3. Process referral reward on signup

```sql
CREATE OR REPLACE FUNCTION process_referral_reward()
RETURNS TRIGGER AS $$
DECLARE
  referrer_user_id uuid;
  reward_points integer := 50; -- Configurable
BEGIN
  IF NEW.referred_by IS NOT NULL THEN
    -- Find referrer
    SELECT id INTO referrer_user_id FROM users WHERE referral_code = NEW.referred_by;
    
    IF referrer_user_id IS NOT NULL THEN
      -- Award points to referrer
      UPDATE users SET points = points + reward_points WHERE id = referrer_user_id;
      INSERT INTO points_log (user_id, amount, type, balance_after, description)
      VALUES (referrer_user_id, reward_points, 'referral', 
        (SELECT points FROM users WHERE id = referrer_user_id),
        'Referral reward for ' || NEW.email);
      
      -- Award points to new user
      UPDATE users SET points = points + reward_points WHERE id = NEW.id;
      INSERT INTO points_log (user_id, amount, type, balance_after, description)
      VALUES (NEW.id, reward_points, 'referral', reward_points, 'Welcome bonus');
      
      -- Log referral
      INSERT INTO referral_logs (referrer_id, referred_id, referral_code, reward_given)
      VALUES (referrer_user_id, NEW.id, NEW.referred_by, true);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER process_user_referral AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION process_referral_reward();
```

### 4. Auto-deduct inventory on order completion

```sql
CREATE OR REPLACE FUNCTION deduct_inventory_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Deduct stock
    UPDATE string_inventory 
    SET stock = stock - 1 
    WHERE id = NEW.string_id;
    
    -- Log stock change
    INSERT INTO stock_logs (string_id, change, type, reference_id, cost_price)
    VALUES (NEW.string_id, -1, 'sale', NEW.id, NEW.cost);
    
    -- Award points to user
    DECLARE
      points_to_award integer := 10; -- Configurable
      new_balance integer;
    BEGIN
      UPDATE users SET points = points + points_to_award WHERE id = NEW.user_id
      RETURNING points INTO new_balance;
      
      INSERT INTO points_log (user_id, amount, type, reference_id, balance_after, description)
      VALUES (NEW.user_id, points_to_award, 'order', NEW.id, new_balance, 'Order completed');
    END;
    
    -- Calculate profit
    NEW.profit = NEW.price - COALESCE(NEW.cost, 0);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_process_order_completion BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION deduct_inventory_on_completion();
```

### 5. Check low stock and send alert

```sql
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock <= NEW.minimum_stock THEN
    INSERT INTO notifications (user_id, title, message, type)
    SELECT id, 'Low Stock Alert', 
      'String ' || NEW.brand || ' ' || NEW.model || ' is running low (' || NEW.stock || ' remaining)',
      'system'
    FROM users WHERE role = 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_inventory_low_stock AFTER UPDATE ON string_inventory
  FOR EACH ROW EXECUTE FUNCTION check_low_stock();
```

---

## Migration Script Summary

**Migration files should be created in order:**

1. `001_create_users_table.sql`
2. `002_create_string_inventory_table.sql`
3. `003_create_orders_table.sql`
4. `004_create_payments_table.sql`
5. `005_create_packages_tables.sql`
6. `006_create_vouchers_tables.sql`
7. `007_create_points_log_table.sql`
8. `008_create_referral_logs_table.sql`
9. `009_create_stock_logs_table.sql`
10. `010_create_notifications_table.sql`
11. `011_create_system_settings_table.sql`
12. `012_create_indexes.sql`
13. `013_create_rls_policies.sql`
14. `014_create_triggers.sql`

---

## Notes

- All `id` columns use `uuid` with `gen_random_uuid()` as default
- All monetary values use `numeric(10,2)` type
- All timestamps use `timestamptz` for timezone awareness
- RLS policies enforce data isolation between users and admins
- Triggers automate core business logic (inventory, points, referrals)
- Indexes optimize common query patterns

---

**End of ERD Document**
