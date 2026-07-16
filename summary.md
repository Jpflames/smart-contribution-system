# Digital Cooperative Contribution Management System (DCCMS)
## Comprehensive Technical & Operational Architecture Guide

DCCMS is a production-grade, secure web application designed to automate financial contributions, manage recurring savings collections, audit manual bank transfers, and dynamically evaluate credit limits for cooperative groups.

This guide provides an end-to-end overview of the system architecture, database models, payment configurations, and operational workflows.

---

## 1. System Overview & Problem Solved

Cooperative groups often face high default rates and administrative overhead due to manual payment collection processes, unverified bank transfer alerts, and poor tracking of penalty liabilities. 

**DCCMS solves these issues by implementing:**
1. **Automated Collection Engine**: Securely tokenizes credit/debit cards via the Paystack gateway to automate recurring savings cycles (weekly, monthly, or customized intervals).
2. **Defaulter & Penalty Ledger**: Tracks payment attempts, applies customized grace periods, automatically retries failed cards, and assesses flat or percentage-based penalty rates.
3. **Manual Bank Reconciliations**: Provides a secure portal for members to submit proof of manual bank transfers and for Treasurers to verify and credit savings wallets.
4. **Intelligent Credit Scoring**: Dynamic risk-assessment engine that tracks saving consistency and default rates to calculate member loan eligibility.
5. **Interactive Identity (Digital ID)**: High-fidelity, flippable membership ID cards equipped with QR verification tokens and light/dark theme switches.

---

## 2. Core Technology Stack

- **Frontend Core**: Next.js 16 (App Router) & React 19.
- **Styling**: TailwindCSS for modern styling and animations.
- **Language**: TypeScript (strict compiler rules).
- **Backend Services**: 
  - **Firebase Authentication**: User accounts, credentials, and session management.
  - **Cloud Firestore**: Real-time NoSQL database.
  - **Firebase Admin SDK**: Private operations, cron integrations, and webhook security.
- **Payments Gateway**: Paystack API (supports sandbox simulation and live tokenized card debits).

---

## 3. Database Architecture (Firestore Collections)

DCCMS operates on a denormalized Firestore database schema designed for maximum query speed and atomic write integrity.

### 3.1 Users (`users`)
Tracks cooperative identities, roles, KYC status, and linked bank coordinates.
```json
{
  "uid": "user_id_string",
  "email": "member@example.com",
  "name": "John Doe",
  "phone": "+2348012345678",
  "role": "super_admin | coop_admin | treasurer | member",
  "coopId": "cooperative_id_string",
  "status": "approved | pending | suspended",
  "kycStatus": "approved | pending | rejected",
  "kycDetails": {
    "residentialAddress": "Address string",
    "occupation": "Occupation string"
  },
  "bankDetails": {
    "bankName": "Bank Name",
    "accountNumber": "0123456789",
    "accountName": "John Doe"
  },
  "createdAt": "ISO_Timestamp"
}
```

### 3.2 Cooperatives (`cooperatives`)
```json
{
  "id": "coop_id_string",
  "name": "Lagos Agriculture Cooperative",
  "logoUrl": "https://url-to-logo.png",
  "status": "active | suspended",
  "settings": {
    "currency": "NGN | USD | GHS",
    "autoDebitEnabled": true,
    "penaltyGraceDays": 3,
    "defaultPenaltyRate": 5.0
  },
  "stats": {
    "totalMembers": 150,
    "activePlansCount": 4,
    "totalSavingsAmount": 12500000
  },
  "createdAt": "ISO_Timestamp"
}
```

### 3.3 Contribution Schemes (`plans`)
Defines the saving rules, amount, and frequency.
```json
{
  "id": "plan_id_string",
  "coopId": "coop_id_string",
  "name": "Monthly Agri-Save",
  "amount": 20000,
  "frequency": "weekly | monthly | quarterly",
  "penaltyType": "flat | percentage",
  "penaltyValue": 1000,
  "gracePeriodDays": 3,
  "isActive": true
}
```

### 3.4 Payments Ledger (`payments`)
Tracks active invoices, billing status, and transaction histories.
```json
{
  "id": "payment_id_string",
  "userId": "user_id_string",
  "userName": "John Doe",
  "coopId": "coop_id_string",
  "planId": "plan_id_string",
  "planName": "Monthly Save",
  "amount": 20000,
  "penaltyAmount": 0,
  "totalAmount": 20000,
  "status": "pending | success | overdue | failed",
  "paymentMethod": "card | bank_transfer",
  "gateway": "paystack",
  "gatewayRef": "pstk_ref_123456",
  "dueDate": "YYYY-MM-DD",
  "paidAt": "ISO_Timestamp | null",
  "failureReason": "Insufficient Funds | null",
  "retryCount": 0
}
```

### 3.5 Wallets & Ledgers (`wallets`)
```json
{
  "id": "user_id_string",
  "userId": "user_id_string",
  "coopId": "coop_id_string",
  "balance": 140000,
  "ledgerBalance": 140000,
  "currency": "NGN",
  "lastUpdated": "ISO_Timestamp"
}
```

### 3.6 Loan Requests (`loans`)
```json
{
  "id": "loan_id_string",
  "userId": "user_id_string",
  "userName": "John Doe",
  "coopId": "coop_id_string",
  "amount": 150000,
  "interestRate": 6.0,
  "durationMonths": 6,
  "monthlyInstallment": 26500,
  "outstandingBalance": 159000,
  "eligibilityScore": 85,
  "status": "pending | approved | active | fully_paid | rejected"
}
```

---

## 4. The Dual-Mode Database Engine

To allow local configuration, testing, and live cloud deployment without changing the code base, DCCMS uses a **Dual-Mode Adapter Layer**:

1. **Live Cloud Mode**: Activated automatically when the `NEXT_PUBLIC_FIREBASE_API_KEY` is present in the environmental variables.
   - Pushes/pulls data directly from **Cloud Firestore** collections.
   - Authorizes users via **Firebase Authentication**.
   - Initiates actual **Paystack Checkout** gateways.
2. **Local Storage Mode (Offline Mode)**: Activated when no environmental variables are provided.
   - Redirects all queries and mutations to the browser's `localStorage` (`coopsync_db_*` keys).
   - Seeds the database on first load with structured, realistic initial datasets (Admins, Treasurers, Members, Plans, and historical payment logs).
   - Uses local event dispatchers (`'coopsync_db_changed'`) to notify and update pages reactively when modifications occur.

---

## 5. Billing & Automated Collection Engine

The billing cycle operates through the automated collection engine, executing either via the `/api/cron/auto-debit` API hook or triggered manually in local offline mode:

1. **Cycle Check**: Queries all active cooperatives and active plans.
2. **Enrolled Check**: Finds members with linked payment cards (tokens stored securely inside `paymentTokens`).
3. **Billing Execution**: Charges the tokenized card.
   - **On Success**: Sets payment status to `success`, records the transaction, credits the member's savings wallet, and dispatches an email invoice.
   - **On Failure**: Updates retry count.
4. **Retry Logic**:
   - Fails are retried at **24-hour** and **72-hour** intervals.
   - If the card fails 3 times, the payment state is marked as `overdue` (defaulter status) and sms alerts are sent.
5. **Penalty Assessment**: Once marked `overdue`, the system automatically assesses a percentage or flat penalty fee (configured by the Coop Admin) and appends it to the payment invoice.

---

## 6. Credit Scoring & Loan Qualifier

Loans are processed using a weighted risk engine that calculates credit health (0-100 score):
- **Saving Consistency (50%)**: Measures how many cycles were paid on time vs. overdue.
- **Defaulter Rate (30%)**: Scores user based on failed card debits and active penalties.
- **Wallet Health (20%)**: Measures overall saved capital.

**Loan Bounds:**
- **Ineligible**: Score < 50.
- **Eligible**: Score >= 50. Max borrow limit is capped at **3x** their total saved savings.

---

## 7. Role-Based Portals & Workspaces

### 7.1 Super Admin (`/super-admin`)
- Registers new cooperatives on the DCCMS platform.
- Invites and approves Cooperative Admins.
- Audits system-wide disputes and manages centralized operations.
- Reviews system-wide action logs.

### 7.2 Cooperative Admin (`/coop-admin`)
- Configures saving schemes (amounts, cycle intervals).
- Defines penalty rules (flat fees or percentages) and grace periods.
- Monitors members' risk indices and identifies payment defaulters.
- Customizes branding parameters (theme primary colors, receipt header terms).
- Waives penalties for justified late payments.

### 7.3 Treasurer Portal (`/treasurer`)
- Reconciles manual bank transfer receipts.
- Approves or declines withdrawal payout requests.
- Reviews and downloads cooperative statements in CSV format.

### 7.4 Member Portal (`/member`)
- Tracks active wallets, upcoming due dates, and loans.
- Modifies personal profile details and settlement bank coordinates.
- Switches their flippable digital ID card between Light and Dark themes.
- Submits proof of manual bank transfer deposits for Treasurer audit.
- Accesses the credit terminal to compute eligibility and request loans.


Super Admin: admin@dccms.com
Coop Admin: coop@dccms.com
Treasurer: treasurer@dccms.com
Member: member1@dccms.com
