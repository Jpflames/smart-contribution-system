import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminFirestore } from '@/lib/firebase-admin';

const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET || '';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Signature header missing' }, { status: 400 });
    }

    if (PAYSTACK_WEBHOOK_SECRET) {
      const hash = crypto
        .createHmac('sha512', PAYSTACK_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      if (hash !== signature) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    
    if (event === 'charge.success') {
      const data = payload.data;
      const reference = data.reference;
      const authorization = data.authorization;
      const metadata = data.metadata || {};
      const { userId, coopId, paymentId } = metadata;

      if (adminFirestore) {
        const db = adminFirestore;
        const batch = db.batch();

        const paymentRef = db.collection('payments').doc(paymentId);
        batch.update(paymentRef, {
          status: 'success',
          paidAt: new Date().toISOString(),
          gatewayRef: reference,
          failureReason: null,
          updatedAt: new Date().toISOString(),
        });

        if (authorization && authorization.reusable && userId && coopId) {
          const tokenRef = db.collection('paymentTokens').doc(`${userId}_${coopId}`);
          batch.set(tokenRef, {
            userId,
            coopId,
            customerCode: data.customer.customer_code,
            authorizationCode: authorization.authorization_code,
            cardType: authorization.card_type,
            last4: authorization.last4,
            expMonth: authorization.exp_month,
            expYear: authorization.exp_year,
            createdAt: new Date().toISOString(),
          }, { merge: true });
        }

        if (userId) {
          const walletRef = db.collection('wallets').doc(userId);
          const walletDoc = await walletRef.get();
          if (walletDoc.exists) {
            const currentBalance = walletDoc.data()?.balance || 0;
            batch.update(walletRef, {
              balance: currentBalance + (data.amount / 100),
              lastUpdated: new Date().toISOString(),
            });
          }
        }

        await batch.commit();
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('Paystack Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
