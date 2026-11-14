// lib/payhere-client.ts — 💳 update-67: Browser එකේ "ගෙවන්න" button එක → PayHere checkout page එකට
"use client";

export type CheckoutResult = "redirecting" | "not_configured" | "login" | "too_many" | "error";

/** Server එකෙන් fields ගෙනැල්ලා hidden form එකක් PayHere එකට submit කරනවා (card විස්තර දාන්නේ PayHere page එකේ) */
export async function startCheckout(item: "gold" | "platinum" | "boost"): Promise<CheckoutResult> {
  let res: Response;
  try {
    res = await fetch("/api/pay/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ item }) });
  } catch {
    return "error";
  }
  if (res.status === 401) return "login";
  if (res.status === 503) return "not_configured";
  if (res.status === 429) return "too_many";
  if (!res.ok) return "error";
  const { action, fields } = (await res.json()) as { action: string; fields: Record<string, string> };
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  form.style.display = "none";
  for (const [k, v] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = k;
    input.value = v;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
  return "redirecting";
}
