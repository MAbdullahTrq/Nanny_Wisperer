# GHL Setup Guide — Nanny Whisperer App Integration

**For:** GoHighLevel (GHL) team  
**Purpose:** Configure GHL so that when a contact pays for a product, the Nanny Whisperer app automatically updates their subscription tier.  
**App URL:** http://46.101.68.166  

Products are already created in GHL. This guide covers only the workflow and webhook configuration needed to sync tier updates to the app.

---

## 1. Webhook endpoint (app side)

The app accepts tier updates at:

| Item | Value |
|------|--------|
| **URL** | `http://46.101.68.166/api/webhooks/ghl` |
| **Method** | `POST` |
| **Content-Type** | `application/json` |

All requests must send a JSON body (see Section 3). The app responds with `200 OK` when the webhook is received (and when tier was updated or skipped).

---

## 2. Tier values the app expects

The app has two role types; each has fixed tier names. **Use these exact strings** in the webhook body (case-sensitive).

| Role | Valid tier values |
|------|-------------------|
| **Host** (families) | `Standard`, `Fast Track`, `VIP` |
| **Nanny** (caregivers) | `Basic`, `Verified`, `Certified` |

Map each GHL product to one of these tier values. The webhook must send that tier string so the app can update the correct profile.

---

## 3. Webhook body format

Send a JSON object with:

- **Who:** Either `contactId` (GHL contact ID) and/or `email` (contact email).  
  The app looks up the user by `contactId` first, then by `email` if needed.
- **What tier:** Either `tier` (recommended) or `productName`.  
  If you send `productName`, it must match one of the tier values in the table above (e.g. `"Fast Track"`).

**Recommended format (by contact ID + tier):**

```json
{
  "contactId": "{{contact.id}}",
  "tier": "Fast Track"
}
```

Replace `"Fast Track"` with the correct tier for the product that was purchased (e.g. `Standard`, `VIP`, `Basic`, `Verified`, `Certified`).

**Alternative (by email):**

```json
{
  "email": "{{contact.email}}",
  "tier": "VIP"
}
```

**Alternative (product name as tier):**  
If the GHL product name is exactly one of the tier strings (e.g. "Fast Track"):

```json
{
  "contactId": "{{contact.id}}",
  "productName": "Fast Track"
}
```

Use the actual merge field for the purchased product name if available (e.g. `{{order.product_name}}` or your workflow variable).

---

## 4. What to configure in GHL

### 4.1 Create one workflow per product (or one workflow with branches)

For each product that should update a tier in the app:

1. **Trigger:** Choose the event that means “this product was paid” in your setup, e.g.:
   - Order/payment completed, or
   - Invoice paid, or
   - Contact tagged with a product/tier tag (if you use tags to represent purchases).
2. **Condition (if needed):** Restrict the workflow so it only runs for the relevant product (e.g. “Fast Track” or “VIP”).
3. **Action — Webhook / Custom webhook:**
   - **URL:** `http://46.101.68.166/api/webhooks/ghl`
   - **Method:** `POST`
   - **Headers:** `Content-Type: application/json`
   - **Body:** JSON from Section 3. Use merge fields so:
     - `contactId` = GHL contact ID (e.g. `{{contact.id}}`)
     - `email` = contact email (e.g. `{{contact.email}}`) if you use it
     - `tier` = the exact app tier for that product (e.g. `Fast Track`, `VIP`, `Standard`, `Basic`, `Verified`, `Certified`)

**Example mapping:**

| GHL product (example) | Send as `tier` in webhook |
|------------------------|---------------------------|
| Standard (Host)        | `Standard`                |
| Fast Track             | `Fast Track`             |
| VIP                    | `VIP`                    |
| Basic (Nanny)           | `Basic`                  |
| Verified               | `Verified`                |
| Certified              | `Certified`               |

Create a separate workflow path (or separate workflow) per product so each payment sends the correct `tier` value.

### 4.2 Optional: single workflow with product → tier mapping

If one workflow runs for “any product purchased”:

- Use a **Condition** or **Switch** so that for each product you send the correct `tier` in the webhook body.
- Still call the same URL: `http://46.101.68.166/api/webhooks/ghl` with the same body shape; only the `tier` (or `productName`) value should change per product.

---

## 5. Testing

1. Use a test contact that already exists in the Nanny Whisperer app (signed up and linked to GHL, so the app has their `contactId` or email).
2. Trigger the workflow (e.g. complete a test payment or add the tag that triggers the workflow).
3. Confirm:
   - The webhook is sent to `http://46.101.68.166/api/webhooks/ghl`.
   - In the app, an admin can go to **Subscriptions** or the user’s profile and see the updated tier.

If the tier does not update, check:

- `contactId` or `email` matches a user in the app who has a Host or Nanny profile.
- `tier` (or `productName`) is exactly one of: `Standard`, `Fast Track`, `VIP`, `Basic`, `Verified`, `Certified`.

---

## 6. Summary checklist for GHL team

- [ ] For each product that should update a tier, ensure a workflow runs when that product is paid (or when the contact is tagged with the tier).
- [ ] In that workflow, add a **Webhook** action to:
  - **URL:** `http://46.101.68.166/api/webhooks/ghl`
  - **Method:** POST
  - **Body:** JSON with `contactId` (e.g. `{{contact.id}}`) and `tier` set to the correct value for that product (`Standard`, `Fast Track`, `VIP`, `Basic`, `Verified`, or `Certified`).
- [ ] Test with a contact that exists in the app and confirm the tier updates in the app after the workflow runs.

No changes are required on the Nanny Whisperer app URL or code for this; configuration is entirely in GHL workflows and webhook actions.
