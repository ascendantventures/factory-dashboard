import crypto from 'crypto';

/**
 * Verify a Vercel webhook signature.
 * Vercel uses HMAC-SHA1 of the raw body with the webhook secret.
 */
export function verifyVercelWebhook(
  rawBody: Buffer,
  signature: string,
  secret: string
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
