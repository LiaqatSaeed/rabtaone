const BASE_URL = process.env.ERP_BASE_URL || "http://localhost:4000";
const TOKEN = process.env.ERP_JWT_TOKEN || "";

if (!TOKEN) {
  console.error("Missing ERP_POLL_TOKEN environment variable");
  process.exit(1);
}

async function fetchPending() {
  const res = await fetch(`${BASE_URL}/api/v1/sync/pending`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pending fetch failed: ${res.status} ${text}`);
  }

  const body = await res.json();
  return body.data || [];
}

async function confirmSync(syncRequest) {
  const invoiceNumber = `INV-${Date.now()}`;
  const totalAmount = Math.round((Math.random() * 100 + 10) * 100) / 100;

  const res = await fetch(`${BASE_URL}/api/v1/sync/${syncRequest.syncId || syncRequest.id}/confirm`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ invoiceNumber, totalAmount }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Confirm failed: ${res.status} ${text}`);
  }

  return res.json();
}

async function pollOnce() {
  try {
    const pending = await fetchPending();
    if (pending.length === 0) {
      console.log(`[${new Date().toISOString()}] No pending sync requests`);
      return;
    }

    for (const req of pending) {
      const syncId = req.syncId || req.id;
      console.log(`Syncing order ${req.order?.id || "unknown"} (request ${syncId})...`);
      const result = await confirmSync(req);
      console.log(`Synced:`, result.data?.id || syncId);
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Poll error`, err.message);
  }
}

console.log("ERP polling started...");
setInterval(pollOnce, 10_000);
void pollOnce();
