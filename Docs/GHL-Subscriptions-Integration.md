# GHL Payment Pages & Subscriptions — App Integration

This app uses **GoHighLevel (GHL)** for payment pages and products (e.g. Standard, Fast Track, VIP). When a contact pays in GHL, you can keep the app in sync so their **tier** updates automatically.

---

## 1. What the app expects from GHL

- **Users** are synced to GHL as **contacts** on signup (and optionally on Google login). The app stores `ghlContactId` on each user.
- **Tiers** are stored on **Host** or **Nanny** profiles in the app DB:
  - **Host tiers:** `Standard`, `Fast Track`, `VIP`
  - **Nanny tiers:** `Basic`, `Verified`, `Certified`

When a contact buys a product in GHL (e.g. Fast Track or VIP), GHL should notify this app so we can set the correct tier on their Host or Nanny profile.

---

## 2. Webhook URL

Your app exposes:

```text
POST https://YOUR_APP_URL/api/webhooks/ghl
```

Replace `YOUR_APP_URL` with your real domain (e.g. `https://yourdomain.com` or your VPS URL).

**Optional:** Set `GHL_WEBHOOK_SECRET` in `.env`. If set, the request must include a signature header (`x-wh-signature` or `x-ghl-signature`); otherwise the webhook returns 401.

---

## 3. How to send tier updates from GHL

### Option A: Workflow → Custom webhook (recommended)

After a **payment success** (or when you tag a contact with a tier):

1. In GHL, create a **Workflow** that runs when:
   - A product/order is paid, or
   - A contact is tagged (e.g. "VIP", "Fast Track"), or
   - A form is submitted.
2. Add an action: **Webhook** or **Custom webhook**.
3. Set:
   - **URL:** `https://YOUR_APP_URL/api/webhooks/ghl`
   - **Method:** POST
   - **Body (JSON):** one of the formats below.

**Body formats the app accepts:**

| Field         | Description                          |
|---------------|--------------------------------------|
| `contactId`   | GHL contact ID (same as stored in app as `ghlContactId`) |
| `email`       | Contact email (used if `contactId` not sent or user not found by contactId) |
| `tier`        | Exact tier string (see below)        |
| `productName` | Optional; if no `tier`, we use this as tier |

**Valid tier values:**

- Host: `Standard`, `Fast Track`, `VIP`
- Nanny: `Basic`, `Verified`, `Certified`

**Example 1 — by contact ID and tier (best):**

```json
{
  "contactId": "abc123xyz",
  "tier": "Fast Track"
}
```

**Example 2 — by email (e.g. from payment form):**

```json
{
  "email": "family@example.com",
  "tier": "VIP"
}
```

**Example 3 — product name as tier:**

If your GHL product name matches a tier exactly, you can send:

```json
{
  "contactId": "{{contact.id}}",
  "productName": "Fast Track"
}
```

The app will treat `productName` as `tier` when `tier` is missing.

---

## 4. Linking payment pages to GHL products

- **Payment pages:** Build and host them in GHL (with your Stripe or GHL payment setup).
- **Products:** Create products in GHL (e.g. “Standard”, “Fast Track”, “VIP”) and attach them to your payment pages.
- **After payment:** In the payment/order automation, trigger the workflow that calls `POST /api/webhooks/ghl` with `contactId` (and optionally `email`) plus `tier` (or `productName`).

The app does not handle payment itself; it only updates tier when GHL tells it (via the webhook).

---

## 5. App pricing pages (optional)

Your app has marketing pricing pages at:

- `/pricing` — overview
- `/pricing/host` — host tiers (Standard, Fast Track, VIP)
- `/pricing/nanny` — nanny tiers (Basic, Verified, Certified)

Right now the CTAs point to `/signup/host` or `/signup/nanny`. To send users to GHL payment instead:

1. In GHL, get the **payment page URL** for each product (or a funnel that includes payment).
2. In the app, change the CTA `href` on the pricing components (e.g. in `app/pricing/host/page.tsx` and `app/pricing/nanny/page.tsx`) from `/signup/host` to the GHL payment URL for that tier, **or** to a GHL form that captures email and then redirects to payment.
3. After payment, use the workflow + webhook above so the app gets `contactId`/`email` and `tier`. New users who only exist in GHL will need to sign up in the app (or you create them via API); existing users will be found by `ghlContactId` or `email` and their tier will update.

---

## 6. Admin Subscriptions page

The **Admin → Subscriptions** page shows **hosts by tier** (counts). Data comes from the app database. Once GHL sends tier updates to the webhook, those counts will reflect the paid tiers. There is no separate “payment provider” dashboard in the app; use GHL (and Stripe if applicable) for payment and subscription details.

---

## 7. Env vars (recap)

| Variable              | Purpose |
|-----------------------|--------|
| `GHL_API_KEY`         | GHL API key (for syncing contacts on signup). |
| `GHL_ACCOUNT_ID`      | GHL location/account ID. |
| `GHL_WEBHOOK_SECRET`  | Optional; if set, webhook requests must include signature. |
| `GHL_INBOUND_WEBHOOK_URL` | Optional; inbound webhook for signup data. |

The webhook URL itself is not an env var; it is `https://YOUR_APP_URL/api/webhooks/ghl` and is configured in your GHL workflow.
