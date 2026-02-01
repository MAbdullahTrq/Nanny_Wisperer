**Nanny Whisperer - Platform User Flow Summary (Developer Context)**

Nanny Whisperer is a **private childcare matchmaking platform**. There is **no public browsing**. Everything is delivered discreetly through **tokenized pages** and **automation** in GHL + a small custom Next.js app.

**👩‍🍼 Nanny Flow**

- **Joins with €20 membership**
- Completes onboarding (skills, experience, languages, lifestyle, availability)
- Enters the database (Airtable)
- Can upgrade to Verified (checks) or Certified (in-house course)
- Waits to be matched - they **do not browse hosts**

When matched, they may receive:

- Standard: text message chat
- Fast Track: automated video interview request
- VIP: concierge-coordinated meeting with host + Kayley

**🏠 Host Flow**

- **Joins with €20 membership**
- Completes onboarding (family details, schedule, expectations)
- Host is placed in a **priority queue** based on tier:
  - Standard → normal processing
  - Fast Track → priority
  - VIP → concierge-first
- Receives curated shortlist via **private token link**
- Views:
  - **Shortlist page** (summary cards)
  - **Nanny CV page** (full profile)
- Can message (Standard), or request interviews (FT/VIP)

**📞 Interview Flow (BOTH must click Proceed)**

**Standard (€20)**

- Only text chat
- If both click **Proceed**, we upsell €200 contract + PDF guide

**Fast Track (€500)**

- Host selects **5 time slots** (GHL calendar)
- Nanny picks one via token link
- NW Zoom call auto-created (no concierge)
- After call → Proceed/Pass

**VIP (€3,000)**

- Host selects **5 slots**
- System checks overlap with **Kayley's calendar**
- Nanny sees only matching slots
- NW Zoom 3-way call with concierge moderating
- After call → concierge manages next steps + contract

**🔍 Matching Engine (Airtable)**

When hosts onboard, the platform compares host &lt;-&gt; nanny using:

- Must-match filters
- 100-point score (40 core, 20 skills, 20 values, 20 bonus)

Certified nannies appear first to VIP hosts.

**🔐 Privacy Model**

- No public search
- All host/nanny pages **tokenized + noindex**
- Zoom uses **generic names** (e.g., "Family 104", "Candidate 203")
- Contact details masked except for Standard users (allowed to share)

**🧩 Platform Split (who builds what)**

**Developer (Next.js + APIs)**

- Tokenized pages: shortlist, CV, interview request
- Scheduling flows (5 slots → nanny selection → Zoom creation)
- Zoom API integration
- Token security
- Airtable CRUD
- Webhooks with GHL

**GHL VA**

- Calendars, pipelines, tags
- Workflows for notifications and reminders
- Messaging for Standard
- Contract upsell
- Courses + PDF access
- Payment logic

**SAME SAME IN MORE DETAIL**

**🚀 Nanny Whisperer - Final Technical Summary for Developer + GHL VA**

_(Short, complete, and includes ALL requirements across every document.)_

**1️⃣ Core Product Model - Discreet, No Open Search**

- No public browsing of nannies or families.
- Hosts receive **private, tokenized links** by email:
  - **Shortlist Page** → multiple nanny summaries
  - **CV Page** → full nanny profile
- All pages must be **private, token-secured, and noindex**.

**2️⃣ Tech Stack Overview**

**Use GHL wherever possible**.  
**External app only where required** (token pages, scheduling logic, Zoom automation).

**✔ GHL (GoHighLevel)**

- Host + Nanny onboarding (all fields from onboarding doc)
- Payments (membership, FT, VIP, €200 contract upsell)
- Pipelines, workflows, tags
- Calendars (Host calendars + VIP concierge calendar)
- Conversations (Standard tier messaging)
- Course hosting (video courses)
- Membership area (PDF guides)

**✔ Airtable**

- Database for Hosts, Nannies, Match Scores, Shortlists, InterviewRequests
- Houses 100-point matching algorithm fields
- Admin/staff browse database internally

**✔ Next.js (Developer)**

- Build tokenized pages (Shortlist, CV, Interview Request)
- Build scheduling logic (host slots → nanny selection → Zoom meeting)
- Implement Proceed/Pass endpoints
- Integrate with Zoom API

**✔ Zoom API**

- One video platform for **Fast Track and VIP**
- NW-owned Zoom account
- Generic display names + waiting room
- No concierge for FT, full concierge for VIP

**3️⃣ Matching System (Based on Uploaded Docs)**

- Must-match filters: location, availability, age groups, special needs, live-in/out
- 100-point scoring system:
  - 40 Core
  - 20 Skills
  - 20 Values/Lifestyle
  - 20 Bonus (languages/salary/certifications)
- VIP hosts see Certified nannies first
- Certified = completed GHL in-house cultural/behavioural course

**4️⃣ Communication & Interview Logic**

**⭐ 1. Standard (€20)**

- Text chat via **GHL Conversations** (can share files & contact details)
- Both see **Proceed / Pass**
- If both Proceed → Offer **€200 PDF Contract + Valentina's Guide**
- No video calls

**⚡ 2. Fast Track (€500)**

- After both Proceed →  
    **Host picks 5 time slots** from their GHL calendar
- Nanny receives tokenized link → chooses slot
- If none: nanny clicks **"None available"** → host selects 5 new slots
- When chosen: **Auto-create NW Zoom meeting**
- No concierge
- Generic names in Zoom

**💎 3. VIP (€3,000: €1,000 deposit + €2,000 balance)**

- After both Proceed →  
    **Host picks 5 slots**
- System checks **overlap with Kayley's GHL concierge calendar**
- Nanny receives only those matching slots
- If none → loop until overlap exists
- When chosen → **Auto-create NW Zoom 3-way call**
- Kayley/Concierge moderates (waiting room, renaming, chat restricted)

**5️⃣ Developer Responsibilities**

- Build tokenized pages:
  - Shortlist
  - Nanny CV
  - Interview Request (host summary + slot selection)
- JWT-based secure tokens & noindex
- Host slot picker (pull from GHL calendar)
- Nanny slot picker (FT = all 5 slots; VIP = filtered by Kayley availability)
- Retry loop for "None available"
- Zoom API integration for automated meetings
- Webhooks to/from GHL + Airtable
- Write & update interview records in Airtable

**6️⃣ GHL VA Responsibilities**

- Build Host calendars + VIP Concierge calendar
- Build workflows sending token links and reminders
- Create "Proceed / Pass" automations
- Configure GHL Conversations for Standard
- Set up €200 contract upsell
- Set up courses + memberships
- Configure email/SMS templates for all tiers
- Handle payment workflows and tier tagging

**7️⃣ Privacy & Discretion Rules**

- No open search
- All shortlists/CVs/private links tokenized
- Hosts & nannies see generic names in Zoom
- Concierge moderates VIP only
- Data isolation: first name + initial only until interview
- All meetings occur through **NW-owned Zoom**, never personal links

**8️⃣ Membership Bonuses (ALL €20 Members)**

Every Host and Nanny who pays the €20 membership receives:

**🎥 Video Courses (GHL Courses Module)**

- Cultural expectations
- Behaviour, communication, best practices
- General onboarding essentials
- Accessible via GHL membership portal

**📄 PDF Guides**

- Profile-writing guide
- Cultural expectations
- Interview preparation
- Host/Nanny role expectations
- Automatically granted to all members

No dev work required - GHL VA manages these.

**✔ This summary gives your tech team exactly what they need to confirm:**

- The **architecture**
- The **tech stack**
- The **skillset required**
- The **responsibilities split** (Developer vs GHL VA)
- The **communication and scheduling flows**
- The **matching logic**
- The **privacy model**