# SAHAYA — 3-Minute Demo Video

Total runtime: **3:00**. Aspect ratio 16:9, export 1080p, max 100MB. Subtitles required for the Tamil + Hindi sections.

> Each shot lists: visual direction, on-screen text (OST), voiceover (VO).

---

## Shot 1 — Hook (0:00 – 0:25)

**Visual**: Real footage (or stock) of an ASHA worker walking through a Tamil Nadu village at sunrise — saree, bag with health kit, sandals on a dirt path. Slow zoom-in.

**OST**: `Lakshmi Devi · ASHA worker · Pollachi`

**VO**: "Lakshmi Devi walks 14 kilometres a day. She sees thirty problems. Today, she will report two of them. The other twenty-eight — a child's rash, a dry tube well, a grandmother who hasn't eaten — will go unheard, because the reporting forms are in English, and the smartphone apps assume she can read."

---

## Shot 2 — The voice note (0:25 – 0:50)

**Visual**: Phone screen, WhatsApp open, recording a voice note (record button held). Tamil voice played, English subtitle below.

**Tamil VO** (Lakshmi or actor): "Ward 4-la oru thatha 2 naal-a saapadala. Kallur tube well odanjirukku. Moonu kuzhandhai-kku rashes."

**English subtitle**: *"Old man in Ward 4 hasn't eaten in two days. Tube well in Kallur is broken. Three children have rashes."*

**OST**: `20 seconds · Tamil · WhatsApp`

---

## Shot 3 — Gemini extraction (0:50 – 1:15)

**Visual**: Animated diagram. Voice waveform → arrow → Gemini logo → arrow → JSON appearing on screen with three structured needs (food / water / health) each with type, urgency, location.

**VO**: "SAHAYA receives the voice note. One Gemini 2.0 call detects the language, transcribes, and extracts every distinct need — type, urgency, location, beneficiary count. Three problems become three records, with confidence."

**OST**: `1 voice → 3 structured needs · 0.8s`

---

## Shot 4 — Map + dispatch (1:15 – 1:45)

**Visual**: SAHAYA dashboard heatmap, zooming into Pollachi region as three pins light up. Cut to **three different phone screens** (volunteers in three villages) receiving WhatsApp dispatch messages simultaneously.

**VO**: "Each need is geocoded and dropped onto a public map. The closest volunteer with the right skill gets a WhatsApp ping in seconds — Arjun for the tube well, Vikram for the meal, Priya for the children."

**OST**: `47 volunteers · 5 villages · 22km median match radius`

---

## Shot 5 — Closed-loop verification (1:45 – 2:20)

**Visual**: Volunteer at the tube well, hand on the pump handle. He takes a photo with his phone. Cut to the photo arriving on the SAHAYA backend, Gemini Vision overlay scanning it, then a green checkmark with `✅ Verified — matches reported issue · 92% confidence`.

**VO**: "When a volunteer fixes it, they don't fill a form. They take a photo. Gemini Vision compares it to the original need — and tells us, with confidence, whether the work matches what was promised. The verified photo becomes part of a public ledger anyone can audit."

**OST**: `Photo → Vision → Verified · Public dashboard`

---

## Shot 6 — Impact dashboard (2:20 – 2:40)

**Visual**: Wide shot of dashboard. KPI strip ticks up: `Needs reported: 47`, `Resolved: 31`, `Avg time-to-resolve: 6.2h`, `Languages: TA · HI · EN`. Heatmap behind, activity feed scrolling.

**VO**: "Today, in five villages around Coimbatore, ASHA workers reported forty-seven needs. Thirty-one were resolved. The average time from voice note to verified fix was six hours."

**OST**: `Public ledger · sahaya.web.app`

---

## Shot 7 — Vision (2:40 – 3:00)

**Visual**: Lakshmi back on screen, smiling, walking up to a house. Cut to a wider frame: sunrise over Tamil Nadu landscape, mountains in distance.

**VO**: "When the people closest to a problem can be heard with their own voice — in their own language, on the app already in their hand — help can finally find them.
SAHAYA. Voice-first community needs intelligence. Built with Gemini, Firestore, Cloud Run."

**OST end card**:
```
SAHAYA
github.com/Mithran-MV/SAHAYA
GDG on Campus — CIT · Solution Challenge 2026
Made with Google AI
```

---

## Production checklist

- [ ] **Real Lakshmi** — your aunt, mother, neighbour, anyone willing to record 20 seconds of Tamil. Real beats polished.
- [ ] **Subtitles** for the Tamil + Hindi sections. Judges who don't speak the language must follow.
- [ ] **Real screen recordings** of WhatsApp + the dashboard, not Figma mocks.
- [ ] **Music**: Indian-classical-influenced ambient, no drums, no vocals, low volume. (Free options: YouTube Audio Library — try "Patil Vasudevan" tracks.)
- [ ] **Final 5 seconds**: clean end card with name + GitHub URL.
- [ ] **Aspect ratio 16:9, 1080p, 100MB max**. (CapCut / iMovie / DaVinci Resolve all export this).
- [ ] Upload to YouTube (unlisted) or Google Drive. Use the YouTube link for Hack2Skill.

## Recording tips

- Use a phone with the front camera for the ASHA shot — feels authentic.
- For dashboard shots, use macOS QuickTime Screen Recording or Windows + G.
- For the Tamil voice note: just hit record on WhatsApp, hand the phone to your aunt, ask her to repeat the sentence twice. Pick the better take.
- Mic: phone mic is fine if you record indoors. Avoid wind noise outside.
- Cut hard between shots — don't cross-fade. Pace = attention.

## Voiceover script (if you want to deliver it yourself)

Tone: warm, factual, slightly hushed. Like NPR.
Read aloud once per shot. Time each pass with a stopwatch. Aim for 2:50 of total VO so you have 10 seconds of breathing room.
