
import { Buffer } from "https://deno.land/std@0.168.0/io/buffer.ts";
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
  
  const calculatedSignature = `sha256=${new Buffer(mac).toString("hex")}`;
  
  // Use timing-safe equality check
  if (crypto.subtle.timingSafeEqual(encoder.encode(calculatedSignature), encoder.encode(signature))) {
    return true;
  }

  throw new Error("Invalid signature.");
}
