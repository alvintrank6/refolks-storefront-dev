const credentials = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server credentials are missing");
  return { url: url.replace(/\/$/, ""), key };
};

export async function getInventoryStock(sku: string): Promise<number | null> {
  const { url, key } = credentials();
  const endpoint = new URL(`${url}/rest/v1/inventory`);
  endpoint.searchParams.set("select", "stock");
  endpoint.searchParams.set("sku", `eq.${sku}`);
  endpoint.searchParams.set("limit", "1");
  const response = await fetch(endpoint, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Inventory read failed: ${response.status}`);
  const rows = (await response.json()) as { stock: number }[];
  return rows[0]?.stock ?? null;
}

export async function markTransfer(token: string): Promise<void> {
  const { url, key } = credentials();
  const endpoint = new URL(`${url}/rest/v1/orders`);
  endpoint.searchParams.set("token", `eq.${token}`);
  endpoint.searchParams.set("payment_method", "eq.transfer");
  endpoint.searchParams.set("customer_marked_paid_at", "is.null");
  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ customer_marked_paid_at: new Date().toISOString() }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Transfer update failed: ${response.status}`);
}
