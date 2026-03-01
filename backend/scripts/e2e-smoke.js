/* eslint-disable no-console */
const API_BASE = process.env.API_BASE_URL || "http://localhost:7101";

function logPass(name) {
  console.log(`✅ ${name} PASS`);
}

function logFail(name, message) {
  console.error(`❌ ${name} FAIL: ${message}`);
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { res, data };
}

async function ensureAccount({ email, password, role, fullName, businessName, industryType }) {
  const register = await request("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, role, fullName, businessName, industryType }),
  });

  if (!register.res.ok && register.res.status !== 409) {
    throw new Error(register.data?.error?.message || "Registration failed");
  }

  const login = await request("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!login.res.ok) {
    throw new Error(login.data?.error?.message || "Login failed");
  }

  return login.data.data.token;
}

async function assertOrderStatus(orderId, token, expected) {
  const { res, data } = await request(`/api/v1/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(data?.error?.message || "Failed to fetch order");
  if (data.data.status !== expected) {
    throw new Error(`Expected status ${expected}, got ${data.data.status}`);
  }
  return data.data;
}

async function run() {
  const credentials = {
    user: { email: "e2e_user@rabtaone.test", password: "Password123!", role: "USER", fullName: "E2E User" },
    merchant: {
      email: "e2e_merchant@rabtaone.test",
      password: "Password123!",
      role: "MERCHANT",
      businessName: "E2E Merchant",
      industryType: "GENERIC",
    },
    rider: { email: "e2e_rider@rabtaone.test", password: "Password123!", role: "DELIVERY", fullName: "E2E Rider" },
    admin: { email: "e2e_admin@rabtaone.test", password: "Password123!", role: "ADMIN", fullName: "E2E Admin" },
  };

  let userToken;
  let merchantToken;
  let riderToken;
  let adminToken;

  try {
    userToken = await ensureAccount(credentials.user);
    logPass("Auth USER");
    merchantToken = await ensureAccount(credentials.merchant);
    logPass("Auth MERCHANT");
    riderToken = await ensureAccount(credentials.rider);
    logPass("Auth RIDER");
    adminToken = await ensureAccount(credentials.admin);
    logPass("Auth ADMIN");
  } catch (err) {
    logFail("Auth setup", err.message);
    process.exit(1);
  }

  let orderId;
  let proposalId;
  let syncId;
  let draftId;

  try {
    const createOrder = await request("/api/v1/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        prescriptionUrl: "https://example.com/prescription.png",
        notes: "E2E test order",
        items: [{ sku: "SKU-1", name: "Item 1", quantity: 1, unitPrice: 10 }],
      }),
    });
    if (!createOrder.res.ok) throw new Error(createOrder.data?.error?.message || "Create order failed");
    orderId = createOrder.data.data.id;
    logPass("Create Order");

    const proposal = await request("/api/v1/proposals", {
      method: "POST",
      headers: { Authorization: `Bearer ${merchantToken}` },
      body: JSON.stringify({
        orderId,
        priceCents: 1200,
        availability: "IN_STOCK",
        deliveryOption: "PICKUP",
      }),
    });
    if (!proposal.res.ok) throw new Error(proposal.data?.error?.message || "Create proposal failed");
    proposalId = proposal.data.data.id;
    logPass("Create Proposal");

    const accept = await request(`/api/v1/orders/${orderId}/accept-proposal`, {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ proposalId }),
    });
    if (!accept.res.ok) throw new Error(accept.data?.error?.message || "Accept proposal failed");
    logPass("Accept Proposal");

    await assertOrderStatus(orderId, userToken, "ACCEPTED");
    logPass("Assert ACCEPTED");

    const pending = await request("/api/v1/sync/pending", {
      headers: { Authorization: `Bearer ${merchantToken}` },
    });
    if (!pending.res.ok) throw new Error(pending.data?.error?.message || "List sync pending failed");
    const pendingPayload = (pending.data.data || []).find((p) => p.order?.id === orderId);
    if (!pendingPayload) throw new Error("Sync payload not found");
    syncId = pendingPayload.syncId;

    const confirm = await request(`/api/v1/sync/${syncId}/confirm`, {
      method: "POST",
      headers: { Authorization: `Bearer ${merchantToken}` },
      body: JSON.stringify({ invoiceNumber: "INV-100", totalAmount: 12.0 }),
    });
    if (!confirm.res.ok) throw new Error(confirm.data?.error?.message || "Sync confirm failed");
    logPass("Confirm Sync");

    await assertOrderStatus(orderId, userToken, "SYNCED");
    logPass("Assert SYNCED");

    const submitPayment = await request(`/api/v1/orders/${orderId}/payment/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ message: "Payment proof submitted" }),
    });
    if (!submitPayment.res.ok) throw new Error(submitPayment.data?.error?.message || "Submit payment failed");
    logPass("Submit Payment");

    await assertOrderStatus(orderId, userToken, "PAYMENT_PENDING");
    logPass("Assert PAYMENT_PENDING");

    const verifyPayment = await request(`/api/v1/orders/${orderId}/payment/verify`, {
      method: "POST",
      headers: { Authorization: `Bearer ${merchantToken}` },
    });
    if (!verifyPayment.res.ok) throw new Error(verifyPayment.data?.error?.message || "Verify payment failed");
    logPass("Verify Payment");

    await assertOrderStatus(orderId, userToken, "PAYMENT_VERIFIED");
    logPass("Assert PAYMENT_VERIFIED");

    const markReady = await request(`/api/v1/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${merchantToken}` },
      body: JSON.stringify({ status: "READY_FOR_DELIVERY" }),
    });
    if (!markReady.res.ok) throw new Error(markReady.data?.error?.message || "Mark ready failed");
    logPass("Mark READY_FOR_DELIVERY");

    const readyOrder = await assertOrderStatus(orderId, userToken, "READY_FOR_DELIVERY");
    if (!readyOrder.deliveryDraft) throw new Error("Delivery draft not created");
    logPass("Assert Draft Created");

    const drafts = await request("/api/v1/rider/drafts", {
      headers: { Authorization: `Bearer ${riderToken}` },
    });
    if (!drafts.res.ok) throw new Error(drafts.data?.error?.message || "List drafts failed");
    const openDraft = (drafts.data.data || []).find((d) => d.orderId === orderId);
    if (!openDraft) throw new Error("Open draft not found");
    draftId = openDraft.id;
    logPass("List Drafts");

    const acceptDraft = await request(`/api/v1/rider/drafts/${draftId}/accept`, {
      method: "POST",
      headers: { Authorization: `Bearer ${riderToken}` },
    });
    if (!acceptDraft.res.ok) throw new Error(acceptDraft.data?.error?.message || "Accept draft failed");
    logPass("Accept Draft");

    const picked = await request(`/api/v1/rider/drafts/${draftId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${riderToken}` },
      body: JSON.stringify({ status: "PICKED" }),
    });
    if (!picked.res.ok) throw new Error(picked.data?.error?.message || "Mark picked failed");
    logPass("Mark PICKED");

    const delivered = await request(`/api/v1/rider/drafts/${draftId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${riderToken}` },
      body: JSON.stringify({ status: "DELIVERED" }),
    });
    if (!delivered.res.ok) throw new Error(delivered.data?.error?.message || "Mark delivered failed");
    logPass("Mark DELIVERED");

    await assertOrderStatus(orderId, userToken, "COMPLETED");
    logPass("Assert COMPLETED");

    const overview = await request("/api/v1/admin/overview", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!overview.res.ok) throw new Error(overview.data?.error?.message || "Admin overview failed");
    const stats = overview.data.data;
    if (!stats || stats.ordersToday < 1) throw new Error("Admin overview counts invalid");
    logPass("Admin Overview");

    console.log("\n✅ E2E SMOKE TEST PASSED");
  } catch (err) {
    logFail("E2E flow", err.message);
    console.error("\n❌ E2E SMOKE TEST FAILED");
    process.exit(1);
  }
}

run();
