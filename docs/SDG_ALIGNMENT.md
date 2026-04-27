# SAHAYA — UN SDG Alignment

SAHAYA addresses **five UN Sustainable Development Goals** through a single intake-to-resolution loop. Each goal below maps to specific targets, the SAHAYA features that contribute, and the metrics we track.

---

## SDG 1 — No Poverty

**Target 1.5**: Build the resilience of the poor and those in vulnerable situations and reduce their exposure to climate-related extreme events and other shocks and disasters.

**Target 1.b**: Create sound policy frameworks at all levels, based on pro-poor and gender-sensitive development strategies.

### How SAHAYA contributes

- Food insecurity, ration shop closures, and shelter loss surfaced within **minutes** of an ASHA worker's voice note.
- Storm-displaced families and homeless elderly are routed to volunteers carrying tarpaulin / shelter kits.
- Public dashboard creates evidence pressure on PDS shops, NREGA delivery, and panchayat welfare schemes.

### Demo dataset examples
- "Old roof collapsed at Karuppu's house in storm last night, family of 5 sleeping outside" → shelter, critical
- "Ration kadai 3 naal-a moodirukku" (PDS shop closed for 3 days) → food, medium
- "Oru widow-ku monthly pension 2 maasam-a delayed" → food, high

### Metrics tracked
- Food/shelter need volume per village per week
- Median time from report → relief delivery
- % of needs from below-poverty-line households (extension)

---

## SDG 3 — Good Health and Well-being

**Target 3.8**: Achieve universal health coverage, including financial risk protection, access to quality essential health-care services and access to safe, effective, quality and affordable essential medicines and vaccines for all.

**Target 3.c**: Substantially increase health financing and the recruitment, development, training and retention of the health workforce.

### How SAHAYA contributes

- ASHA workers (the actual frontline of universal primary healthcare in rural India) get a one-tap reporting tool that doesn't require typing or English literacy.
- PHC stockouts, antenatal-care lapses, TB medicine gaps, malnutrition cases surfaced and routed to district health staff.
- Closed-loop photo verification creates accountability for medicine deliveries and patient follow-ups.

### Demo dataset examples
- "PHC has no fever medicine since Monday" → health, critical
- "Pregnant woman ko O+ blood urgent chahiye" → health, critical
- "TB ke patient ki dawai khatam ho gayi" → health, high
- "3 vayasu kuzhandhai-kku severe malnutrition" → health, high

### Metrics tracked
- Number of health-related needs resolved
- Time from PHC stockout report → restock confirmation
- Distribution of need types — health vs. non-health balance

---

## SDG 5 — Gender Equality

**Target 5.5**: Ensure women's full and effective participation and equal opportunities for leadership at all levels of decision-making in political, economic and public life.

**Target 5.b**: Enhance the use of enabling technology, in particular ICT, to promote the empowerment of women.

### How SAHAYA contributes

- The entire reporter network (ASHA workers) is **100% women**. SAHAYA amplifies their professional voice into a public, mappable, accountable signal.
- **Voice-first design** specifically removes the literacy barrier that affects women more than men in rural India (female literacy 65% vs. male 82%, NFHS-5 2021).
- Recognition: first-name display on the public dashboard ("Reported by Lakshmi") makes their work visible to the wider community.
- Reports prioritize women-and-children-specific issues: anganwadi outages, antenatal care lapses, women's safety on unlit streets.

### Demo dataset examples
- "Anganwadi 3 mein paani nahi aa raha hai do din se" → water, high (affects 30+ children + women caregivers)
- "Street light verala 2 weeks-a, ladies-ku night-la pora paya" → safety, high
- "Pregnant women-ku checkup illa 2 weeks-a" → health, medium
- "Mental health counselling needed for women SHG members, 5 reported anxiety" → health, medium

### Metrics tracked
- Number of women reporters active per week
- Gender-disaggregated beneficiary count (extension)
- Reports of safety, gender-based violence, maternal health resolved

---

## SDG 10 — Reduced Inequalities

**Target 10.2**: By 2030, empower and promote the social, economic and political inclusion of all, irrespective of age, sex, disability, race, ethnicity, origin, religion or economic or other status.

**Target 10.3**: Ensure equal opportunity and reduce inequalities of outcome.

### How SAHAYA contributes

- **Public-read dashboard** makes village-level needs visible to journalists, NGOs, and policy makers — not just to government databases inaccessible to the public.
- **Multilingual at the model layer** ensures Tamil, Hindi, and English speakers are equally heard. Gemini 2.0 is the equalizer.
- Migrant families, tribal families, widows, and homeless elderly are specifically surfaced in our demo dataset because the voice-first interface lowers the bar to advocate for them.
- Differently-abled access (school for special needs children) raised explicitly.

### Demo dataset examples
- "Tribal family of 4 living in plastic tent for 1 month, monsoon coming" → shelter, high
- "Two migrant parivaar ko khana nahi mil raha, woh ration card nahi hai" → food, high (8 beneficiaries)
- "Special needs kuzhandhai-kku school illa" → education, high
- "Mettupalayam corner-la oru old man-ku veedu illa" → shelter, high

### Metrics tracked
- Geographic distribution of resolved needs (urban vs. rural balance)
- Language distribution of reports (TA / HI / EN ratios)
- Need-type equity: how skewed is resolution rate across categories

---

## SDG 11 — Sustainable Cities and Communities

**Target 11.3**: Enhance inclusive and sustainable urbanization and capacity for participatory, integrated and sustainable human settlement planning and management.

**Target 11.b**: Implement integrated policies and plans towards inclusion, resource efficiency, mitigation and adaptation to climate change, resilience to disasters.

### How SAHAYA contributes

- Spatial heatmap of community needs gives panchayats and municipal corporations **evidence for ward-level planning** — not anecdotal complaints, but mapped, time-stamped, photo-verified data.
- Infrastructure issues (potholes, broken streetlights, blocked drains, missing bus shelters) are routed to volunteers AND surfaced on the public dashboard for civic pressure.
- Ready to integrate with municipal complaint portals (e.g., Tamil Nadu's ICCC platform) as a structured upstream feed.

### Demo dataset examples
- "Annur-Mettupalayam road has 4 large potholes near the school crossing" → infrastructure, medium
- "Open drain near bus stand has been overflowing for a week" → sanitation, high
- "Public bus shelter has no roof, women wait in sun + rain" → infrastructure, medium
- "Street light verala 2 weeks-a" → safety, high

### Metrics tracked
- Spatial concentration of unresolved needs (hotspot identification)
- % of infrastructure needs reaching municipal-level escalation
- Resolution rate by category and by ward

---

## Beyond the five primary goals

SAHAYA also touches:

- **SDG 2 (Zero Hunger)** — anganwadi nutrition gaps, food relief routing
- **SDG 4 (Quality Education)** — school dropout, teacher absenteeism, missing learning materials
- **SDG 6 (Clean Water & Sanitation)** — broken tube wells, contaminated tap water, blocked drains
- **SDG 16 (Peace, Justice & Strong Institutions)** — public accountability via the dashboard, escalation pathways

We focus the submission narrative on the **five primary goals** where the contribution is most direct, measurable, and tied to specific UN targets.

---

## Why this combination wins

Most "SDG hackathon" projects pick **one** SDG and execute against it. SAHAYA's design — a single voice-to-resolution loop — naturally hits **five**. That is not because we are stretching; it is because the underlying problem (frontline workers cannot easily report what they see) is causally upstream of all five goals. Fix the intake, and you fix the bottleneck for poverty, health, gender, equity, and local planning at the same time.
