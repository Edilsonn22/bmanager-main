import "dotenv/config";
import crypto from "crypto";

const callbackUrl = process.env.DEBITO_CALLBACK_URL;
const secret = process.env.DEBITO_WEBHOOK_SECRET;
if (!callbackUrl || !secret) throw new Error("Configure DEBITO_CALLBACK_URL e DEBITO_WEBHOOK_SECRET.");

const payload = JSON.stringify({
  event: "payment.completed",
  data: { id: `vendai-test-${Date.now()}` },
});
const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
const response = await fetch(callbackUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Webhook-Signature": `sha256=${signature}`,
  },
  body: payload,
  signal: AbortSignal.timeout(20_000),
});
const body = await response.text();
console.log(`Webhook Débito Pay: HTTP ${response.status} ${body}`);
if (!response.ok) process.exitCode = 1;
