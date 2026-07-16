import { Payment, Wallet } from '@/types';

export function calculateMemberRiskScore(
  memberId: string,
  payments: Payment[],
  wallet: Wallet | null,
  membershipDurationDays: number = 90
): { score: number; rating: 'Low' | 'Medium' | 'High'; failureRate: number } {
  const memberPayments = payments.filter(p => p.userId === memberId);
  if (memberPayments.length === 0) {
    return { score: 70, rating: 'Medium', failureRate: 0 }; 
  }

  // 1. Payment Success Rate (40%)
  const totalAttempts = memberPayments.length;
  const successfulPayments = memberPayments.filter(p => p.status === 'success').length;
  const failedPayments = memberPayments.filter(p => p.status === 'failed' || p.status === 'overdue').length;
  const successRate = totalAttempts > 0 ? (successfulPayments / totalAttempts) * 100 : 100;
  const failureRate = totalAttempts > 0 ? (failedPayments / totalAttempts) * 100 : 0;

  // 2. Overdue Severity (30% penalty)
  const currentOverdueCount = memberPayments.filter(p => p.status === 'overdue').length;
  const overduePenalty = Math.min(currentOverdueCount * 25, 70); 

  // 3. Wallet Balance Health (20%)
  const walletBalance = wallet ? wallet.balance : 0;
  const averagePlanAmount = memberPayments[0]?.amount || 10000;
  const walletRatio = averagePlanAmount > 0 ? Math.min((walletBalance / averagePlanAmount) * 100, 100) : 100;

  // 4. Tenure stability (10%)
  const tenureCredit = Math.min((membershipDurationDays / 180) * 100, 100);

  // Compile weighted score
  const rawScore = (successRate * 0.4) + (walletRatio * 0.2) + (tenureCredit * 0.1) + (30 - overduePenalty);
  const score = Math.max(0, Math.min(Math.round(rawScore), 100));

  let rating: 'Low' | 'Medium' | 'High' = 'Medium';
  if (score >= 75) {
    rating = 'Low'; 
  } else if (score < 45) {
    rating = 'High'; 
  }

  return { score, rating, failureRate };
}

export function isEligibleForLoan(
  riskScore: number,
  walletBalance: number,
  requestedAmount: number,
  totalContributions: number
): { eligible: boolean; maxEligibleAmount: number; reason: string } {
  // Max loan amount is 3x their total contributions, provided risk score is >= 50
  const maxEligibleAmount = totalContributions * 3;

  if (riskScore < 50) {
    return {
      eligible: false,
      maxEligibleAmount: 0,
      reason: `Risk score too low (${riskScore}/100). Minimum required is 50.`,
    };
  }

  if (requestedAmount > maxEligibleAmount) {
    return {
      eligible: false,
      maxEligibleAmount,
      reason: `Requested amount exceeds limit. The maximum you can borrow is 3x your total contributions (${maxEligibleAmount.toLocaleString()}).`,
    };
  }

  return {
    eligible: true,
    maxEligibleAmount,
    reason: 'Congratulations! You are eligible for this loan based on your savings history and risk score.',
  };
}
