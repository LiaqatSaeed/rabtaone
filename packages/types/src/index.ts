export type Role = "USER" | "MERCHANT" | "DELIVERY" | "ADMIN";

export type OrderStatus =
  | "REQUESTED"
  | "PROPOSED"
  | "ACCEPTED"
  | "SYNC_PENDING"
  | "SYNCED"
  | "PAYMENT_PENDING"
  | "PAYMENT_VERIFIED"
  | "READY_FOR_DELIVERY"
  | "OUT_FOR_DELIVERY"
  | "COMPLETED"
  | "CANCELLED";

export type DeliveryStatus = "OPEN" | "ASSIGNED" | "PICKED" | "DELIVERED" | "CANCELLED";

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
  paymentProofFileId?: string | null;
  paymentNote?: string | null;
  items?: OrderItem[];
  shipName?: string | null;
  shipPhone?: string | null;
  shipAddress1?: string | null;
  shipAddress2?: string | null;
  shipCity?: string | null;
  shipState?: string | null;
  shipPostalCode?: string | null;
  shipCountry?: string | null;
  deliveryDraft?: DeliveryDraft | null;
  merchant?: { id: string; name: string } | null;
  proposals?: Proposal[];
};

export type Proposal = {
  id: string;
  orderId: string;
  merchantId: string;
  priceCents: number;
  availability: string;
  deliveryOption: string;
  status?: "PENDING" | "ACCEPTED" | "REJECTED";
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

export type DeliveryDraft = {
  id: string;
  orderId: string;
  status: DeliveryStatus;
  riderId?: string | null;
  createdAt: string;
  updatedAt: string;
  order?: Order;
};

export type JwtPayload = {
  sub: string;
  roles?: Role[];
  role?: Role;
  name?: string;
  industryType?: string;
};
