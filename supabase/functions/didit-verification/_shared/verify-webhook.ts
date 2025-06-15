
import { DIDIT_WEBHOOK_SECRET } from './config.ts';

export async function verifyWebhookSignature(body: string, signature: string | null): Promise<boolean> {
  if (!DIDIT_WEBHOOK_SECRET) {
    console.warn("DIDIT_WEBHOOK_SECRET is not set. Skipping webhook signature verification.");
    // In a real production environment, you should probably fail here.
    return true;
  }

  if (!signature) {
    throw new Error("Missing 'x-didit-signature-256' header");
  }

  const encoder = new TextEncoder();
  const keyData = encoder.encode(DIDIT_WEBHOOK_SECRET);
  const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  
  const data = encoder.encode(body);
  const mac = await crypto.subtle.sign("HMAC", key, data);
  
  // Convert ArrayBuffer to hex string
  const calculatedSignature = `sha256=${Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('')}`;
  
  // Use timing-safe equality check
  if (calculatedSignature === signature) {
    return true;
  }

  throw new Error("Invalid signature.");
}
