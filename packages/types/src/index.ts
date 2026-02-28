export type Role = "USER" | "MERCHANT" | "DELIVERY" | "ADMIN";

export type OrderStatus =
  | "REQUESTED"
  | "PROPOSED"
  | "ACCEPTED"
  | "SYNC_PENDING"
  | "SYNCED"
  | "OUT_FOR_DELIVERY"
  | "COMPLETED"
  | "CANCELLED";

export type OrderItem = {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type Order = {
  id: string;
  status: OrderStatus;
  createdAt: string;
  items?: OrderItem[];
  shipName?: string | null;
  shipPhone?: string | null;
  shipAddress1?: string | null;
  shipAddress2?: string | null;
  shipCity?: string | null;
  shipState?: string | null;
  shipPostalCode?: string | null;
  shipCountry?: string | null;
};

export type Proposal = {
  id: string;
  orderId: string;
  merchantId: string;
  priceCents: number;
  availability: string;
  deliveryOption: string;
  createdAt: string;
};

export type SyncRequestPayload = {
  syncId: string;
  merchantId: string;
  industryType: string;
  createdAt?: string;
  order: {
    id: string;
    items: OrderItem[];
    totalAmount: number;
    customer: { name: string; phone: string | null };
    shipping?: {
      name?: string | null;
      phone?: string | null;
      address1?: string | null;
      address2?: string | null;
      city?: string | null;
      state?: string | null;
      postalCode?: string | null;
      country?: string | null;
    };
  };
};

export type JwtPayload = {
  sub: string;
  role: Role;
  name?: string;
  industryType?: string;
};
