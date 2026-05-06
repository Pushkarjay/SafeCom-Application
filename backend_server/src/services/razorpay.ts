import crypto from 'node:crypto'

export interface RazorpayCheckoutOrder {
  provider: 'razorpay' | 'mock'
  keyId: string
  orderId: string
  amountPaise: number
  currency: string
  receipt: string
  notes: Record<string, string>
}

export interface RazorpayVerificationResult {
  provider: 'razorpay' | 'mock'
  verified: boolean
  orderId: string
  paymentId: string
  signature: string
  message: string
}

export interface RazorpayOrderInput {
  amountPaise: number
  currency: string
  receipt: string
  notes: Record<string, string>
}

export interface RazorpayVerificationInput {
  orderId: string
  paymentId: string
  signature?: string
}

const razorpayKeyId = process.env.RAZORPAY_KEY_ID ?? ''
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET ?? ''
const razorpayApiBase = 'https://api.razorpay.com/v1'

function buildMockOrderId(): string {
  return `order_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function getRazorpayConfig() {
  const isMockMode = !(razorpayKeyId && razorpayKeySecret);
  const provider = isMockMode ? 'mock' : 'razorpay';
  
  // Warn if running in mock mode in production
  if (isMockMode && process.env.NODE_ENV === 'production') {
    console.warn('[RAZORPAY] WARNING: Running in mock mode in production environment!');
    console.warn('[RAZORPAY] Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables for live payments.');
  }
  
  return {
    keyId: razorpayKeyId,
    hasSecret: razorpayKeySecret.length > 0,
    provider: provider as 'razorpay' | 'mock'
  } as const;
}

export async function createCheckoutOrder(input: RazorpayOrderInput): Promise<RazorpayCheckoutOrder> {
  const provider = getRazorpayConfig().provider

  if (provider === 'razorpay') {
    const response = await fetch(`${razorpayApiBase}/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: input.amountPaise,
        currency: input.currency,
        receipt: input.receipt,
        notes: input.notes
      })
    })

    if (!response.ok) {
      throw new Error(`Razorpay order creation failed with status ${response.status}`)
    }

    const payload = await response.json() as { id: string; amount: number; currency: string; receipt?: string }

    return {
      provider: 'razorpay',
      keyId: razorpayKeyId,
      orderId: payload.id,
      amountPaise: payload.amount,
      currency: payload.currency,
      receipt: payload.receipt ?? input.receipt,
      notes: input.notes
    }
  }

  return {
    provider: 'mock',
    keyId: razorpayKeyId || 'rzp_test_mock_key',
    orderId: buildMockOrderId(),
    amountPaise: input.amountPaise,
    currency: input.currency,
    receipt: input.receipt,
    notes: input.notes
  }
}

export function verifyCheckoutSignature(input: RazorpayVerificationInput): RazorpayVerificationResult {
  const provider = getRazorpayConfig().provider

  if (provider === 'mock') {
    return {
      provider: 'mock',
      verified: true,
      orderId: input.orderId,
      paymentId: input.paymentId,
      signature: input.signature ?? 'mock-signature',
      message: 'Mock payment accepted in development mode'
    }
  }

  if (!input.signature) {
    return {
      provider: 'razorpay',
      verified: false,
      orderId: input.orderId,
      paymentId: input.paymentId,
      signature: '',
      message: 'Missing payment signature'
    }
  }

  const expectedSignature = crypto
    .createHmac('sha256', razorpayKeySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest('hex')

  const verified = expectedSignature === input.signature

  return {
    provider: 'razorpay',
    verified,
    orderId: input.orderId,
    paymentId: input.paymentId,
    signature: input.signature,
    message: verified ? 'Payment signature verified' : 'Invalid payment signature'
  }
}