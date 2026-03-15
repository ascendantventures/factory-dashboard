import crypto from 'crypto';

/**
 * Verify a Vercel webhook signature.
 * Vercel signs the raw body with HMAC-SHA1 using the webhook secret.
 * The signature is sent in the `x-vercel-signature` header.
 */
export function verifyVercelWebhook(
  rawBody: Buffer,
  signature: string,
  secret: string,
): boolean {
  try {
    const expected = crypto
      .createHmac('sha1', secret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expected, 'hex');
    const signatureBuf = Buffer.from(signature, 'hex');

    if (expectedBuf.length !== signatureBuf.length) return false;

    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch {
    return false;
  }
}
