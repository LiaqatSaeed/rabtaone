# Create Order (v1)

**Endpoint**
- `POST /api/v1/orders`

**Auth**
- JWT (Role: USER)

**Request Body**
See `backend/docs/order-create.example.json`.

Notes:
- `items` is optional
- `declaredTotalAmount` is optional; if provided, it is validated against items
- `shipping` is optional but recommended for delivery use-cases

**Example**
```json
{
  "prescriptionUrl": "https://example.com/prescription.png",
  "notes": "Please deliver after 5pm",
  "shipping": {
    "name": "Jane Doe",
    "phone": "+1-555-222-3333",
    "address1": "123 Market St",
    "address2": "Apt 9",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94103",
    "country": "US"
  },
  "items": [
    { "sku": "SKU-001", "name": "Item A", "quantity": 2, "unitPrice": 9.99 },
    { "sku": "SKU-002", "name": "Item B", "quantity": 1, "unitPrice": 19.5 }
  ],
  "declaredTotalAmount": 39.48
}
```
