import { NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { chargeAuthorization } from '@/lib/paystack';

export async function POST(req: Request) {
  try {
    if (!adminFirestore) {
      return NextResponse.json({
        message: 'Simulation Mode: Cloud Firestore is not configured. Recurring billing logic should be executed via the client-side Local Storage billing simulation console.',
      }, { status: 200 });
    }

    const db = adminFirestore;
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // 1. Fetch all cooperatives
    const coopsSnapshot = await db.collection('cooperatives').get();
    const results: any[] = [];

    for (const coopDoc of coopsSnapshot.docs) {
      const coop = { id: coopDoc.id, ...coopDoc.data() } as any;
      if (coop.status !== 'active') continue;

      // 2. Fetch plans in this coop
      const plansSnapshot = await db.collection('plans').where('coopId', '==', coop.id).get();
      const plans = plansSnapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));

      for (const plan of plans) {
        // 3. Fetch members enrolled in this plan
        const membersSnapshot = await db.collection('users')
          .where('coopId', '==', coop.id)
          .where('role', '==', 'member')
          .where('status', '==', 'approved')
          .get();

        for (const memberDoc of membersSnapshot.docs) {
          const member = { id: memberDoc.id, ...memberDoc.data() } as any;

          // Check if payment token exists
          const tokenDoc = await db.collection('paymentTokens').doc(`${member.id}_${coop.id}`).get();
          if (!tokenDoc.exists()) continue; // No linked card

          const tokenData = tokenDoc.data();

          // Check if payment already exists for this cycle (e.g. currentMonthStr)
          const cyclePaymentQuery = await db.collection('payments')
            .where('userId', '==', member.id)
            .where('planId', '==', plan.id)
            .where('dueDate', '==', `${currentMonthStr}-${String(plan.dueDay).padStart(2, '0')}`)
            .get();

          let paymentDoc = null;
          let paymentRef = null;

          if (cyclePaymentQuery.empty) {
            // Create initial pending payment record
            const newPayment = {
              userId: member.id,
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
              gatewayRef: `pending_${Math.random().toString(36).substring(2, 10)}`,
              dueDate: `${currentMonthStr}-${String(plan.dueDay).padStart(2, '0')}`,
              paidAt: null,
              failureReason: null,
              retryCount: 0,
              createdAt: new Date().toISOString(),
            };
            paymentRef = await db.collection('payments').add(newPayment);
            paymentDoc = newPayment;
          } else {
            paymentRef = cyclePaymentQuery.docs[0].ref;
            paymentDoc = { id: paymentRef.id, ...cyclePaymentQuery.docs[0].data() } as any;
          }

          // If payment was already successful, skip
          if (paymentDoc.status === 'success') continue;

          // If payment retry count is exhausted, skip or apply penalties
          if (paymentDoc.retryCount >= 3) {
            if (paymentDoc.status !== 'overdue') {
              // Mark overdue and apply penalty
              let penalty = 0;
              if (coop.settings.penaltyType === 'flat') {
                penalty = coop.settings.penaltyFlatFee;
              } else if (coop.settings.penaltyType === 'percentage') {
                penalty = Math.round(plan.amount * (coop.settings.penaltyPercentage / 100));
              }

              await paymentRef.update({
                status: 'overdue',
                penaltyAmount: penalty,
                totalAmount: plan.amount + penalty,
                updatedAt: new Date().toISOString(),
              });

              // Create Penalty Ledger entry
              await db.collection('penalties').add({
                userId: member.id,
                coopId: coop.id,
                paymentId: paymentRef.id,
                amount: penalty,
                status: 'unpaid',
                calculatedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
              });

              // Flag member as defaulter
              await db.collection('users').doc(member.id).update({
                hasDefaulted: true,
                updatedAt: new Date().toISOString(),
              });
            }
            continue;
          }

          // Attempt charge authorization
          const chargeResult = await chargeAuthorization(
            tokenData?.authorizationCode,
            member.email,
            plan.amount,
            { userId: member.id, coopId: coop.id, paymentId: paymentRef.id }
          );

          if (chargeResult.success) {
            // Update payment record
            await paymentRef.update({
              status: 'success',
              paidAt: new Date().toISOString(),
              gatewayRef: chargeResult.gatewayRef,
              failureReason: null,
              updatedAt: new Date().toISOString(),
            });

            // Update user wallet balance
            const walletRef = db.collection('wallets').doc(member.id);
            const walletDoc = await walletRef.get();
            if (walletDoc.exists()) {
              const currentBalance = walletDoc.data()?.balance || 0;
              await walletRef.update({
                balance: currentBalance + plan.amount,
                lastUpdated: new Date().toISOString(),
              });
            } else {
              await walletRef.set({
                userId: member.id,
                coopId: coop.id,
                balance: plan.amount,
                ledgerBalance: plan.amount,
                currency: coop.settings.currency,
                lastUpdated: new Date().toISOString(),
              });
            }

            // Create notification
            await db.collection('notifications').add({
              userId: member.id,
              title: 'Auto Debit Successful',
              message: `Your monthly contribution of ${coop.settings.currency} ${plan.amount.toLocaleString()} was successfully charged.`,
              type: 'success',
              read: false,
              createdAt: new Date().toISOString(),
            });

            results.push({ member: member.name, status: 'charged' });
          } else {
            // Update failed attempts
            const nextRetryCount = paymentDoc.retryCount + 1;
            await paymentRef.update({
              retryCount: nextRetryCount,
              failureReason: chargeResult.failureReason,
              gatewayRef: chargeResult.gatewayRef,
              updatedAt: new Date().toISOString(),
            });

            // Notify user
            await db.collection('notifications').add({
              userId: member.id,
              title: 'Auto Debit Failed',
              message: `Attempt #${nextRetryCount} to debit your card for ${plan.name} failed: ${chargeResult.failureReason}. Next retry scheduled in 24 hours.`,
              type: 'warning',
              read: false,
              createdAt: new Date().toISOString(),
            });

            results.push({ member: member.name, status: 'failed', reason: chargeResult.failureReason });
          }
        }
      }
    }

    return NextResponse.json({
      message: 'Background billing scheduler completed processing.',
      details: results,
    });
  } catch (error: any) {
    console.error('Scheduler Cron Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
