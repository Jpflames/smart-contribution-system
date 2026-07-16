import { NextResponse } from 'next/server';
import { initializeTransaction } from '@/lib/paystack';

export async function POST(req: Request) {
  try {
    const { email, amount, callbackUrl, metadata } = await req.json();

    if (!email || !amount || !callbackUrl) {
      return NextResponse.json(
        { error: 'Email, amount, and callbackUrl are required' },
        { status: 400 }
      );
    }

    const paystackResult = await initializeTransaction(email, amount, callbackUrl, metadata);

    return NextResponse.json(paystackResult);
  } catch (error: any) {
    console.error('Paystack Initialize API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
