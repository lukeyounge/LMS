# Paid Course Enrollment System Plan

## Overview

This document outlines the plan for implementing a user-friendly, beautiful, fast, and secure paid enrollment system for the LMS platform.

---

## Current State Summary

The codebase already has a solid foundation:
- ✅ Paystack payment integration with Edge Functions
- ✅ Transaction tracking database schema
- ✅ Checkout page and payment callback flow
- ✅ Automatic enrollment after successful payment
- ✅ Webhook for payment verification

### Identified Friction Points

1. **Multi-step process** - User must navigate: Course → Checkout → Paystack → Callback
2. **Authentication required first** - Can't browse pricing without account
3. **No course bundles** - Can only buy one course at a time
4. **Limited payment options** - Only Paystack currently
5. **No promotional pricing** - No coupons, discounts, or special offers
6. **Post-purchase gap** - No welcome email or onboarding flow

---

## Proposed Enhancements

### 1. Streamlined One-Page Checkout

**Current:** Course Detail → Checkout Page → Paystack → Callback (4 pages)

**Proposed:** Course Detail with inline checkout → Paystack → Success Modal (2.5 steps)

```
┌─────────────────────────────────────────────────────────────┐
│  Course: Advanced React Patterns                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Course Hero Image/Video Preview]                          │
│                                                             │
│  What you'll learn:                                         │
│  • Server components • Suspense patterns • Performance      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐          │
│  │  💳 Quick Checkout                           │          │
│  │                                              │          │
│  │  R499.00  ̶R̶6̶2̶4̶ ̶  (20% off)                 │          │
│  │                                              │          │
│  │  [Email: _______________] (if not logged in) │          │
│  │                                              │          │
│  │  [🔒 Pay Securely with Paystack]             │          │
│  │                                              │          │
│  │  ✓ Instant access after payment              │          │
│  │  ✓ 30-day money-back guarantee               │          │
│  │  ✓ Lifetime access                           │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

**Key Features:**
- **Inline checkout card** on course detail page (no redirect to separate checkout)
- **Email-first checkout** for guests (create account after purchase)
- **Single button** to initiate payment
- **Success modal** instead of redirect to separate page

---

### 2. Guest Checkout with Deferred Account Creation

**Flow:**
```
1. Guest browses course → Enters email → Pays
2. Payment succeeds → Transaction linked to email
3. Modal: "Set a password to access your course"
4. Account created → Auto-enrolled → Redirect to course
```

**Benefits:**
- No signup friction before purchase
- Email captured for marketing even if they abandon
- Account creation feels like a reward, not a barrier

**Database Change:**
```sql
-- Add pending_email to transactions for guest checkout
ALTER TABLE transactions ADD COLUMN pending_email TEXT;
ALTER TABLE transactions ADD COLUMN claimed_at TIMESTAMPTZ;

-- Allow transactions without user_id initially
ALTER TABLE transactions ALTER COLUMN user_id DROP NOT NULL;
```

---

### 3. Course Bundles & Suites

**New Feature:** Allow instructors to bundle courses at a discount.

```sql
-- New tables
CREATE TABLE course_bundles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bundle_courses (
  bundle_id UUID REFERENCES course_bundles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  PRIMARY KEY (bundle_id, course_id)
);
```

**UI Concept:**
```
┌─────────────────────────────────────────┐
│  🎁 Complete Web Dev Bundle             │
│                                         │
│  [Course 1] [Course 2] [Course 3]       │
│                                         │
│  3 courses • 45 hours • R1,299          │
│  Save R448 (26% off buying separately)  │
│                                         │
│  [Get the Bundle]                       │
└─────────────────────────────────────────┘
```

---

### 4. Promotional Pricing System

**Coupon Codes:**
```sql
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');

CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_type discount_type NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  course_id UUID REFERENCES courses(id), -- NULL = all courses
  instructor_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID REFERENCES coupons(id),
  transaction_id UUID REFERENCES transactions(id),
  user_id UUID REFERENCES users(id),
  redeemed_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Checkout UI with Coupon:**
```
┌──────────────────────────────────────────┐
│  Course: Advanced React        R499.00   │
│  Coupon: LAUNCH20             -R99.80   │
│  ─────────────────────────────────────   │
│  Total:                        R399.20   │
│                                          │
│  [Have a coupon? ▼]                      │
│  [LAUNCH20        ] [Apply]              │
│  ✓ Coupon applied! 20% off               │
└──────────────────────────────────────────┘
```

---

### 5. Enhanced Trust & Security UI

**Payment Security Signals:**

```
┌─────────────────────────────────────────────┐
│  🔒 Secure Checkout                         │
│                                             │
│  [Paystack Logo] [Visa] [Mastercard]        │
│                                             │
│  ✓ 256-bit SSL encryption                   │
│  ✓ PCI-DSS compliant payment processing     │
│  ✓ We never store your card details         │
│                                             │
│  💯 30-Day Money-Back Guarantee             │
│  Not satisfied? Get a full refund,          │
│  no questions asked.                        │
└─────────────────────────────────────────────┘
```

---

### 6. Post-Purchase Onboarding

**Immediate Actions After Payment:**

1. **Success Modal** (not a page redirect):
```
┌─────────────────────────────────────────────┐
│           🎉 You're In!                     │
│                                             │
│   Welcome to Advanced React Patterns        │
│                                             │
│   [▶ Start Learning Now]                    │
│                                             │
│   Receipt sent to: user@email.com           │
│                                             │
│   Quick tips:                               │
│   • Lessons auto-save your progress         │
│   • Ask the AI tutor if you get stuck       │
│   • Certificate awarded on completion       │
└─────────────────────────────────────────────┘
```

2. **Welcome Email** (via Supabase Edge Function + Resend/SendGrid):
```
Subject: 🎓 Welcome to [Course Name] - Let's Get Started!

Hi [Name],

You're now enrolled in [Course Name]!

[Start Learning Button]

Here's what's waiting for you:
• 12 lessons across 4 sections
• 3 hands-on projects
• AI-powered tutor for questions
• Certificate of completion

Your receipt is attached.

Happy learning!
```

---

### 7. Mobile-Optimized Checkout

**Considerations:**
- Large tap targets (44px minimum)
- Single-column layout
- Sticky "Pay" button at bottom
- Minimal form fields
- Apple Pay / Google Pay integration (future)

```
┌─────────────────────┐
│ Advanced React      │
│ R499.00             │
├─────────────────────┤
│ [Email           ]  │
│                     │
│ [Coupon code?    ]  │
├─────────────────────┤
│ ✓ 30-day guarantee  │
│ ✓ Instant access    │
├─────────────────────┤
│ [🔒 Pay R499.00   ] │ ← Sticky bottom
└─────────────────────┘
```

---

## Implementation Phases

### Phase 1: Quick Wins (1-2 days)
- [ ] Fix "Stripe" → "Paystack" branding in CourseDetail
- [ ] Add inline checkout card to CourseDetail page
- [ ] Implement success modal instead of separate callback page
- [ ] Add trust badges and security messaging

### Phase 2: Guest Checkout (2-3 days)
- [ ] Database: Add `pending_email` to transactions
- [ ] Edge Function: Allow payment without auth
- [ ] Post-payment account creation flow
- [ ] Claim transaction when account created

### Phase 3: Promotional Pricing (2-3 days)
- [ ] Database: Coupons and redemptions tables
- [ ] Coupon validation Edge Function
- [ ] Checkout UI with coupon input
- [ ] Instructor coupon management UI

### Phase 4: Course Bundles (3-4 days)
- [ ] Database: Bundles and bundle_courses tables
- [ ] Bundle creation UI for instructors
- [ ] Bundle detail page
- [ ] Bundle checkout flow

### Phase 5: Post-Purchase Experience (2-3 days)
- [ ] Welcome email Edge Function
- [ ] Receipt generation
- [ ] Onboarding modal component
- [ ] Course quick-start guide

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| Price manipulation | Edge Function re-fetches price from DB (already done ✓) |
| Replay attacks | Transaction reference uniqueness (already done ✓) |
| HMAC verification | Webhook signature check (already done ✓) |
| Guest abuse | Rate limit by email + CAPTCHA for repeated attempts |
| Coupon abuse | Max uses, per-user limits, expiry dates |
| Refund fraud | Manual review for refunds, 30-day limit |

---

## Success Metrics

Track these to measure improvement:

1. **Checkout conversion rate** - % who start checkout and complete
2. **Time to first lesson** - Seconds from payment to viewing content
3. **Cart abandonment rate** - % who view checkout but don't pay
4. **Guest vs. authenticated purchases** - Ratio and conversion rates
5. **Coupon usage rate** - % of purchases using coupons

---

## Technical Architecture

### Payment Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Course      │     │  Paystack    │     │  Supabase    │
│  Detail Page │────▶│  Checkout    │────▶│  Edge Func   │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │                    │                    ▼
       │                    │           ┌──────────────┐
       │                    │           │  Database    │
       │                    │           │  Transaction │
       │                    │           └──────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Success     │◀────│  Webhook     │◀────│  Enrollment  │
│  Modal       │     │  Callback    │     │  Created     │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `src/pages/CourseDetail.tsx` | Course page with inline checkout |
| `src/components/PaymentSuccessModal.tsx` | Success modal (new) |
| `src/components/InlineCheckout.tsx` | Checkout card component (new) |
| `src/services/paymentService.ts` | Payment API client |
| `supabase/functions/initialize-payment/` | Edge Function |
| `supabase/functions/verify-payment/` | Edge Function |

---

## Summary

The existing Paystack integration is solid. The main opportunities are:

1. **Reduce friction** - Inline checkout, guest purchasing, fewer page loads
2. **Increase trust** - Better security messaging, familiar payment logos
3. **Drive conversions** - Coupons, bundles, urgency messaging
4. **Improve experience** - Success modals, welcome emails, onboarding

---

*Last Updated: January 2026*
