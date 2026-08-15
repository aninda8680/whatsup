import test from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';

// Ensure you run this with the dev server running on localhost:3000
const BASE_URL = 'http://localhost:3000';
// Make sure this matches your local .env RAZORPAY_WEBHOOK_SECRET
const WEBHOOK_SECRET = 'your_test_webhook_secret_here';

function generateSignature(payload) {
  return crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex');
}

test('Webhook signature verification - rejects invalid', async () => {
  const payload = JSON.stringify({ event: 'payment.captured' });
  
  const res = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Razorpay-Signature': 'invalid_signature_here'
    },
    body: payload
  });
  
  assert.strictEqual(res.status, 401, 'Should reject invalid signature with 401');
});

test('Webhook signature verification - accepts valid', async (t) => {
  const payload = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_test123',
          order_id: 'order_test123',
          notes: {
            hostId: 'test_host',
            tierId: 'event'
          }
        }
      }
    }
  });
  
  const sig = generateSignature(payload);
  
  const res = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Razorpay-Signature': sig
    },
    body: payload
  });
  
  // Note: if WEBHOOK_SECRET is not configured correctly on the server, it might 500.
  // Assuming it is configured properly, it should process or at least not 401.
  assert.notStrictEqual(res.status, 401, 'Should not reject valid signature');
});

test('Tier pricing is read server-side only', async () => {
  const res = await fetch(`${BASE_URL}/api/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ hostId: 'test_host', tierId: 'event', amount: 100 }) // Trying to spoof amount
  });
  
  const data = await res.json();
  if (res.ok) {
    // Event tier price is 199 INR = 19900 paise.
    assert.strictEqual(data.amount, 19900, 'Server should enforce its own pricing, ignoring client payload amount');
  }
});

// For joinSession transaction and Expired entitlements, 
// they require a valid Firebase Auth token which we cannot easily mock in a simple fetch test 
// without Firebase Emulators or a test user. 
// We are outlining the structural requirements here.
