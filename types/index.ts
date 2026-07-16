export type UserRole = 'super_admin' | 'coop_admin' | 'treasurer' | 'member';

export interface NextOfKin {
  name: string;
  relationship: string;
  phone: string;
}

export interface KYCDetails {
  nationalId?: string;
  idUrl?: string;
  photographUrl?: string;
  residentialAddress: string;
  occupation: string;
  nextOfKin: NextOfKin;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  phone: string;
  status: 'pending' | 'approved' | 'suspended';
  kycStatus: 'pending' | 'approved' | 'rejected';
  kycDetails?: KYCDetails;
  bankDetails?: BankDetails;
  coopId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptBranding {
  color: string;
  headerText: string;
}

export interface CooperativeSettings {
  currency: string;
  autoDebitEnabled: boolean;
  retryIntervalDays: number;
  penaltyFlatFee: number;
  penaltyPercentage: number;
  penaltyType: 'flat' | 'percentage' | 'compound';
  gracePeriodDays: number;
  receiptBranding: ReceiptBranding;
  webhookSecret: string;
}

export interface CooperativeStats {
  totalMembers: number;
  activeMembers: number;
  totalRevenue: number;
  totalOutstanding: number;
  totalDefaulters: number;
}

export interface Cooperative {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  status: 'active' | 'inactive';
  settings: CooperativeSettings;
  stats: CooperativeStats;
  createdAt: string;
}

export interface Plan {
  id: string;
  coopId: string;
  name: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  dueDay: number; // day of the month/week
  gracePeriodDays: number;
  penaltyFee: number;
  maxMembers: number;
  autoDebitEnabled: boolean;
  reminderSchedule: number[]; // days before due date
  exitRules: string;
  createdAt: string;
}

export interface PaymentToken {
  id: string;
  userId: string;
  coopId: string;
  customerCode: string;
  authorizationCode: string;
  cardType: string;
  last4: string;
  expMonth: string;
  expYear: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  userName: string;
  coopId: string;
  planId: string;
  planName: string;
  amount: number;
  penaltyAmount: number;
  totalAmount: number;
  status: 'success' | 'failed' | 'pending' | 'overdue';
  paymentMethod: 'card' | 'bank_transfer' | 'manual';
  gateway: 'paystack';
  gatewayRef: string;
  dueDate: string;
  paidAt: string | null;
  failureReason: string | null;
  retryCount: number;
  createdAt: string;
}

export interface Wallet {
  id: string; // userId as key
  userId: string;
  coopId: string;
  balance: number;
  ledgerBalance: number;
  currency: string;
  lastUpdated: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  coopId: string;
  amount: number;
  bankDetails: BankDetails;
  status: 'pending' | 'approved' | 'rejected';
  processedBy: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface Loan {
  id: string;
  userId: string;
  userName: string;
  coopId: string;
  amount: number;
  interestRate: number;
  durationMonths: number;
  monthlyInstallment: number;
  outstandingBalance: number;
  eligibilityScore: number;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'repaid';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  createdAt: string;
}
