import { chargeAuthorization } from './paystack';
import { sendEmail, sendSMS } from './notifications';
import { Payment, UserProfile, Cooperative, Plan, Wallet } from '@/types';

export async function runLocalAutoDebitCron(): Promise<{ message: string; results: string[] }> {
  if (typeof window === 'undefined') {
    return { message: 'Not in browser context', results: [] };
  }

  const results: string[] = [];
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Get current LocalStorage tables
  const storedUsers = localStorage.getItem('coopsync_db_users');
  const storedCoops = localStorage.getItem('coopsync_db_cooperatives');
  const storedPlans = localStorage.getItem('coopsync_db_plans');
  const storedTokens = localStorage.getItem('coopsync_db_paymentTokens');
  const storedPayments = localStorage.getItem('coopsync_db_payments');
  const storedWallets = localStorage.getItem('coopsync_db_wallets');
  const storedPenalties = localStorage.getItem('coopsync_db_penalties');

  let dbUsers: UserProfile[] = storedUsers ? JSON.parse(storedUsers) : [];
  let dbCoops: Cooperative[] = storedCoops ? JSON.parse(storedCoops) : [];
  let dbPlans: Plan[] = storedPlans ? JSON.parse(storedPlans) : [];
  let dbTokens: any[] = storedTokens ? JSON.parse(storedTokens) : [];
  let dbPayments: Payment[] = storedPayments ? JSON.parse(storedPayments) : [];
  let dbWallets: Wallet[] = storedWallets ? JSON.parse(storedWallets) : [];
  let dbPenalties: any[] = storedPenalties ? JSON.parse(storedPenalties) : [];

  for (const coop of dbCoops) {
    if (coop.status !== 'active') continue;

    const coopPlans = dbPlans.filter(p => p.coopId === coop.id);

    for (const plan of coopPlans) {
      // Find members enrolled in this coop
      const members = dbUsers.filter(u => u.coopId === coop.id && u.role === 'member' && u.status === 'approved');

      for (const member of members) {
        // Find payment token
        const token = dbTokens.find(t => t.userId === member.uid && t.coopId === coop.id);
        if (!token) continue; // Skip if no linked card

        // Expected due date for this cycle
        const expectedDueDate = `${currentMonthStr}-${String(plan.dueDay).padStart(2, '0')}`;

        // Check if there is an existing payment record for this plan, member, and due date
        let paymentIndex = dbPayments.findIndex(
          p => p.userId === member.uid && p.planId === plan.id && p.dueDate === expectedDueDate
        );

        let payment: Payment;

        if (paymentIndex === -1) {
          // Create new pending payment
          payment = {
            id: `pay_sim_${Math.random().toString(36).substring(2, 9)}`,
            userId: member.uid,
            userName: member.name,
            coopId: coop.id,
            planId: plan.id,
            planName: plan.name,
            amount: plan.amount,
            penaltyAmount: 0,
            totalAmount: plan.amount,
            status: 'pending',
            paymentMethod: 'card',
            gateway: 'paystack',
            gatewayRef: `pending_${Math.random().toString(36).substring(2, 9)}`,
            dueDate: expectedDueDate,
            paidAt: null,
            failureReason: null,
            retryCount: 0,
            createdAt: now.toISOString()
          };
          dbPayments.push(payment);
          paymentIndex = dbPayments.length - 1;
        } else {
          payment = dbPayments[paymentIndex];
        }

        if (payment.status === 'success') continue;

        if (payment.retryCount >= 3) {
          if (payment.status !== 'overdue') {
            // Apply Late Penalty
            let penalty = 0;
            if (coop.settings.penaltyType === 'flat') {
              penalty = coop.settings.penaltyFlatFee;
            } else if (coop.settings.penaltyType === 'percentage') {
              penalty = Math.round(plan.amount * (coop.settings.penaltyPercentage / 100));
            } else {
              // Compound - simulated
              penalty = Math.round(coop.settings.penaltyFlatFee + (plan.amount * 0.05));
            }

            payment.status = 'overdue';
            payment.penaltyAmount = penalty;
            payment.totalAmount = plan.amount + penalty;

            dbPenalties.push({
              id: `pen_sim_${Math.random().toString(36).substring(2, 9)}`,
              userId: member.uid,
              coopId: coop.id,
              paymentId: payment.id,
              amount: penalty,
              status: 'unpaid',
              calculatedAt: now.toISOString(),
              createdAt: now.toISOString()
            });

            // Mark user status has defaulted in LocalStorage db
            const uIdx = dbUsers.findIndex(u => u.uid === member.uid);
            if (uIdx !== -1) {
              dbUsers[uIdx] = {
                ...dbUsers[uIdx],
                updatedAt: now.toISOString()
              };
            }

            // Recalculate coop outstanding balances
            coop.stats.totalOutstanding += plan.amount + penalty;
            coop.stats.totalDefaulters = dbPayments.filter(p => p.coopId === coop.id && p.status === 'overdue').length;

            // Trigger Alert SMS
            await sendSMS(
              member.uid,
              member.phone,
              `⚠️ CoopSync alert: Auto-debit for ${plan.name} has failed 3 times. Your account is flagged as OVERDUE and a penalty of ${coop.settings.currency} ${penalty.toLocaleString()} has been charged.`
            );

            results.push(`🚨 [Overdue] ${member.name} flagged! Penalty of ${coop.settings.currency} ${penalty} charged.`);
          }
          continue;
        }

        // Charge authorization simulator
        const chargeResult = await chargeAuthorization(
          token.authorizationCode,
          member.email,
          plan.amount,
          { userId: member.uid, coopId: coop.id, paymentId: payment.id }
        );

        if (chargeResult.success) {
          payment.status = 'success';
          payment.paidAt = now.toISOString();
          payment.gatewayRef = chargeResult.gatewayRef;
          payment.failureReason = null;

          // Credit member's wallet
          let wallet = dbWallets.find(w => w.userId === member.uid);
          if (wallet) {
            wallet.balance += plan.amount;
            wallet.lastUpdated = now.toISOString();
          } else {
            dbWallets.push({
              id: member.uid,
              userId: member.uid,
              coopId: coop.id,
              balance: plan.amount,
              ledgerBalance: plan.amount,
              currency: coop.settings.currency,
              lastUpdated: now.toISOString()
            });
          }

          // Credit cooperative stats
          coop.stats.totalRevenue += plan.amount;

          // Dispatch success receipt email
          await sendEmail(
            member.uid,
            member.email,
            'Contribution Payment Receipt',
            `Hello ${member.name},\n\nYour contribution of ${coop.settings.currency} ${plan.amount.toLocaleString()} for the plan "${plan.name}" was processed successfully.\n\nReceipt Number: REC-${payment.id.substring(0, 8).toUpperCase()}\nRef: ${chargeResult.gatewayRef}\n\nThank you for contribution,\n${coop.name}`
          );

          results.push(`✅ [Paid] Charged ${member.name} ${coop.settings.currency} ${plan.amount.toLocaleString()} successfully.`);
        } else {
          payment.retryCount += 1;
          payment.failureReason = chargeResult.failureReason;
          payment.gatewayRef = chargeResult.gatewayRef;

          // Send fail notice
          await sendSMS(
            member.uid,
            member.phone,
            `❌ Payment Alert: Automatic debit for ${plan.name} failed (${chargeResult.failureReason}). We will retry in 24 hours.`
          );

          results.push(`❌ [Failed] Charge failed for ${member.name}: ${chargeResult.failureReason} (Attempt ${payment.retryCount}/3).`);
        }
      }
    }
  }

  // Save back to local storage
  localStorage.setItem('coopsync_db_users', JSON.stringify(dbUsers));
  localStorage.setItem('coopsync_db_cooperatives', JSON.stringify(dbCoops));
  localStorage.setItem('coopsync_db_payments', JSON.stringify(dbPayments));
  localStorage.setItem('coopsync_db_wallets', JSON.stringify(dbWallets));
  localStorage.setItem('coopsync_db_penalties', JSON.stringify(dbPenalties));

  window.dispatchEvent(new Event('coopsync_db_changed'));

  return {
    message: `Evaluation Cron Run Completed. Successful debits: ${results.filter(r => r.includes('✅')).length}. Failures: ${results.filter(r => r.includes('❌')).length}. Alerts: ${results.filter(r => r.includes('🚨')).length}.`,
    results
  };
}
