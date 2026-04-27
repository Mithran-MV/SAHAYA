/**
 * Seed dataset for the SAHAYA demo.
 *
 * 5 villages around Coimbatore. 10 volunteers. 47 needs (mostly Tamil, some
 * Hindi, some English). 31 of those have a "verified" resolution with a
 * royalty-free photo URL.
 *
 * The data is hand-written to feel grounded and culturally accurate.
 */

import type { NeedStatus, NeedType, Urgency, Language } from '../domain/types';

export interface VillageSeed {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export const VILLAGES: VillageSeed[] = [
  { id: 'pollachi', name: 'Pollachi', lat: 10.6562, lng: 77.0086 },
  { id: 'sulur', name: 'Sulur', lat: 10.9928, lng: 77.1212 },
  { id: 'annur', name: 'Annur', lat: 11.2382, lng: 77.1083 },
  { id: 'mettupalayam', name: 'Mettupalayam', lat: 11.2997, lng: 76.9389 },
  { id: 'karamadai', name: 'Karamadai', lat: 11.2435, lng: 76.9624 },
];

export interface VolunteerSeed {
  phone: string;
  name: string;
  skills: NeedType[];
  villageId: string;
  serviceRadiusKm: number;
}

export const VOLUNTEERS: VolunteerSeed[] = [
  { phone: '+91900000001', name: 'Arjun Ramaswamy', skills: ['water', 'infrastructure', 'sanitation'], villageId: 'pollachi', serviceRadiusKm: 18 },
  { phone: '+91900000002', name: 'Vikram Subramaniam', skills: ['health', 'food'], villageId: 'pollachi', serviceRadiusKm: 12 },
  { phone: '+91900000003', name: 'Priya Krishnan', skills: ['health', 'education'], villageId: 'sulur', serviceRadiusKm: 15 },
  { phone: '+91900000004', name: 'Sandhya Lakshmi', skills: ['food', 'shelter', 'sanitation'], villageId: 'sulur', serviceRadiusKm: 10 },
  { phone: '+91900000005', name: 'Rajesh Mohan', skills: ['water', 'infrastructure'], villageId: 'annur', serviceRadiusKm: 20 },
  { phone: '+91900000006', name: 'Karthik Iyer', skills: ['safety', 'infrastructure'], villageId: 'annur', serviceRadiusKm: 22 },
  { phone: '+91900000007', name: 'Divya Murthy', skills: ['education', 'health'], villageId: 'mettupalayam', serviceRadiusKm: 14 },
  { phone: '+91900000008', name: 'Suresh Kannan', skills: ['food', 'shelter'], villageId: 'mettupalayam', serviceRadiusKm: 16 },
  { phone: '+91900000009', name: 'Anita Devi', skills: ['health', 'sanitation', 'water'], villageId: 'karamadai', serviceRadiusKm: 18 },
  { phone: '+91900000010', name: 'Manoj Selvan', skills: ['education', 'safety', 'shelter'], villageId: 'karamadai', serviceRadiusKm: 12 },
];

export interface AshaSeed {
  phone: string;
  name: string;
}

export const ASHAS: AshaSeed[] = [
  { phone: '+91911111101', name: 'Lakshmi Devi' },
  { phone: '+91911111102', name: 'Priya Sundaram' },
  { phone: '+91911111103', name: 'Meena Kumari' },
  { phone: '+91911111104', name: 'Saraswati Bai' },
  { phone: '+91911111105', name: 'Kavitha Raman' },
];

export interface NeedSeed {
  ashaIndex: number;
  villageId: string;
  jitter?: { lat: number; lng: number };
  needType: NeedType;
  urgency: Urgency;
  language: Language;
  rawQuote: string;
  rawText: string;
  beneficiaryCount?: number;
  locationHint: string;
  reasoning: string;
  status: NeedStatus;
  hoursAgo: number;
  resolvedHoursLater?: number;
  photoUrl?: string;
  verificationConfidence?: number;
  verificationReason?: string;
  assignedVolunteerIndex?: number;
}

const PHOTO = {
  food: [
    'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600',
    'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=600',
  ],
  water: [
    'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600',
    'https://images.unsplash.com/photo-1532634733-cae1395e440f?w=600',
  ],
  health: [
    'https://images.unsplash.com/photo-1583912267550-d44c9c46d3a4?w=600',
    'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=600',
  ],
  sanitation: [
    'https://images.unsplash.com/photo-1581578017093-cd30fce4eeb7?w=600',
    'https://images.unsplash.com/photo-1626197031507-c17099753214?w=600',
  ],
  education: [
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600',
    'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=600',
  ],
  shelter: [
    'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600',
  ],
  safety: [
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600',
  ],
  infrastructure: [
    'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600',
    'https://images.unsplash.com/photo-1535732820275-9ffd998cac22?w=600',
  ],
  other: ['https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600'],
};

function pickPhoto(t: NeedType): string {
  const arr = PHOTO[t] ?? PHOTO.other;
  return arr[Math.floor(Math.random() * arr.length)];
}

export const NEEDS: NeedSeed[] = [
  // ----- Pollachi (asha 0: Lakshmi) -----
  {
    ashaIndex: 0, villageId: 'pollachi', jitter: { lat: 0.002, lng: 0.001 },
    needType: 'food', urgency: 'high', language: 'ta',
    rawQuote: 'Ward 4-la oru thatha 2 naal-a saapadala',
    rawText: 'Ward 4-la oru thatha 2 naal-a saapadala, kallur tube well odanjirukku, moonu kuzhandhai-kku rashes.',
    beneficiaryCount: 1,
    locationHint: 'Ward 4 Pollachi',
    reasoning: 'Elderly without food for 2 days indicates urgent food relief.',
    status: 'verified', hoursAgo: 28, resolvedHoursLater: 6,
    photoUrl: pickPhoto('food'), verificationConfidence: 0.92,
    verificationReason: 'Photo shows hot meal being delivered to elderly person — matches reported need.',
    assignedVolunteerIndex: 1,
  },
  {
    ashaIndex: 0, villageId: 'pollachi', jitter: { lat: 0.005, lng: -0.003 },
    needType: 'water', urgency: 'critical', language: 'ta',
    rawQuote: 'kallur tube well odanjirukku',
    rawText: 'Ward 4-la oru thatha 2 naal-a saapadala, kallur tube well odanjirukku.',
    locationHint: 'Kallur',
    reasoning: 'Broken tube well affecting whole village; critical drinking water access.',
    status: 'verified', hoursAgo: 28, resolvedHoursLater: 4,
    photoUrl: pickPhoto('water'), verificationConfidence: 0.88,
    verificationReason: 'Photo shows repaired tube well with water flowing.',
    assignedVolunteerIndex: 0,
  },
  {
    ashaIndex: 0, villageId: 'pollachi', jitter: { lat: 0.002, lng: 0.001 },
    needType: 'health', urgency: 'high', language: 'ta',
    rawQuote: 'moonu kuzhandhai-kku rashes',
    rawText: 'Ward 4-la oru thatha 2 naal-a saapadala, moonu kuzhandhai-kku rashes.',
    beneficiaryCount: 3,
    locationHint: 'Ward 4 Pollachi',
    reasoning: 'Three children with rashes — possible scabies outbreak; needs medical assessment.',
    status: 'verified', hoursAgo: 28, resolvedHoursLater: 8,
    photoUrl: pickPhoto('health'), verificationConfidence: 0.81,
    verificationReason: 'Photo shows child being examined by health worker.',
    assignedVolunteerIndex: 1,
  },
  {
    ashaIndex: 0, villageId: 'pollachi',
    needType: 'shelter', urgency: 'critical', language: 'en',
    rawQuote: "Old roof collapsed at Karuppu's house in storm last night",
    rawText: "Old roof collapsed at Karuppu's house in storm last night, family of 5 sleeping outside.",
    beneficiaryCount: 5,
    locationHint: 'Pollachi outskirts',
    reasoning: 'Family displaced by storm needs immediate temporary shelter + tarpaulin.',
    status: 'in_progress', hoursAgo: 5,
    assignedVolunteerIndex: 1,
  },
  {
    ashaIndex: 0, villageId: 'pollachi',
    needType: 'sanitation', urgency: 'medium', language: 'ta',
    rawQuote: 'street-la garbage clean panala vechirukku oru week-a',
    rawText: 'Street-la garbage clean panala vechirukku oru week-a, mosquito problem.',
    locationHint: 'Pollachi market area',
    reasoning: 'Uncollected garbage breeds mosquitoes; sanitation crew needed.',
    status: 'verified', hoursAgo: 18, resolvedHoursLater: 10,
    photoUrl: pickPhoto('sanitation'), verificationConfidence: 0.76,
    verificationReason: 'Photo shows cleared street with garbage bags removed.',
    assignedVolunteerIndex: 3,
  },
  {
    ashaIndex: 0, villageId: 'pollachi',
    needType: 'food', urgency: 'medium', language: 'ta',
    rawQuote: 'ration kadai 3 naal-a moodirukku',
    rawText: 'Ration kadai 3 naal-a moodirukku, families wait panindhukirudhu.',
    locationHint: 'Pollachi PDS shop',
    reasoning: 'Closed PDS shop for 3 days affects food security for many families.',
    status: 'open', hoursAgo: 3,
  },
  {
    ashaIndex: 0, villageId: 'pollachi',
    needType: 'education', urgency: 'low', language: 'ta',
    rawQuote: 'school-la books varala',
    rawText: 'Anganwadi school-la books varala new year-ku, kuzhandhai motivation kammi.',
    locationHint: 'Pollachi anganwadi 2',
    reasoning: 'Missing school supplies; non-urgent but affects engagement.',
    status: 'open', hoursAgo: 12,
  },

  // ----- Sulur (asha 1: Priya) -----
  {
    ashaIndex: 1, villageId: 'sulur',
    needType: 'water', urgency: 'high', language: 'hi',
    rawQuote: 'Sulur ke anganwadi mein paani nahi hai',
    rawText: 'Anganwadi 3 mein paani nahi aa raha hai do din se, bachhon ko nahane ka problem hai.',
    locationHint: 'Anganwadi 3 Sulur',
    reasoning: 'Childcare centre without water for 2 days affects 30+ children.',
    status: 'verified', hoursAgo: 32, resolvedHoursLater: 6,
    photoUrl: pickPhoto('water'), verificationConfidence: 0.85,
    verificationReason: 'Photo shows water tank being filled.',
    assignedVolunteerIndex: 0,
  },
  {
    ashaIndex: 1, villageId: 'sulur',
    needType: 'health', urgency: 'critical', language: 'en',
    rawQuote: 'PHC has no fever medicine since Monday',
    rawText: 'Sulur primary health centre has no fever medicine since Monday.',
    locationHint: 'Sulur PHC',
    reasoning: 'Stockout of basic medicine at PHC during fever season is critical.',
    status: 'verified', hoursAgo: 36, resolvedHoursLater: 5,
    photoUrl: pickPhoto('health'), verificationConfidence: 0.89,
    verificationReason: 'Photo shows medicine stock being delivered to PHC.',
    assignedVolunteerIndex: 2,
  },
  {
    ashaIndex: 1, villageId: 'sulur',
    needType: 'health', urgency: 'high', language: 'hi',
    rawQuote: 'Yashoda devi ko dawai chahiye',
    rawText: 'Yashoda devi ko dawai chahiye, blood pressure bahut high hai.',
    beneficiaryCount: 1,
    locationHint: 'Sulur ward 7',
    reasoning: 'Hypertensive elderly without medication — high health risk.',
    status: 'verified', hoursAgo: 14, resolvedHoursLater: 3,
    photoUrl: pickPhoto('health'), verificationConfidence: 0.83,
    verificationReason: 'Photo shows medicine box being handed over.',
    assignedVolunteerIndex: 2,
  },
  {
    ashaIndex: 1, villageId: 'sulur',
    needType: 'sanitation', urgency: 'high', language: 'hi',
    rawQuote: 'naali bandh ho gayi hai',
    rawText: 'Sulur main road ki naali bandh ho gayi hai, paani street pe aa raha hai.',
    locationHint: 'Sulur main road',
    reasoning: 'Blocked drain on main road; mosquito breeding + traffic risk.',
    status: 'in_progress', hoursAgo: 8,
    assignedVolunteerIndex: 3,
  },
  {
    ashaIndex: 1, villageId: 'sulur',
    needType: 'food', urgency: 'high', language: 'hi',
    rawQuote: 'do parivaar ko khana nahi mil raha',
    rawText: 'Do migrant parivaar ko khana nahi mil raha, woh ration card nahi hai.',
    beneficiaryCount: 8,
    locationHint: 'Sulur labour quarters',
    reasoning: 'Migrant families without ration cards; food relief needed.',
    status: 'verified', hoursAgo: 22, resolvedHoursLater: 7,
    photoUrl: pickPhoto('food'), verificationConfidence: 0.79,
    verificationReason: 'Photo shows food packets being distributed to families.',
    assignedVolunteerIndex: 3,
  },
  {
    ashaIndex: 1, villageId: 'sulur',
    needType: 'water', urgency: 'medium', language: 'ta',
    rawQuote: 'water tank cleaning panala 6 maasam-a',
    rawText: 'Public water tank cleaning panala 6 maasam-a, paasi koodirukku.',
    locationHint: 'Sulur water tank',
    reasoning: 'Algae buildup in unmaintained tank; regular cleaning needed.',
    status: 'open', hoursAgo: 4,
  },
  {
    ashaIndex: 1, villageId: 'sulur',
    needType: 'health', urgency: 'medium', language: 'ta',
    rawQuote: 'pregnant women-ku checkup illa 2 weeks-a',
    rawText: 'Sulur PHC-la pregnant women-ku regular checkup illa 2 weeks-a.',
    beneficiaryCount: 6,
    locationHint: 'Sulur PHC',
    reasoning: 'Antenatal care lapse for 6 women; gynae visit overdue.',
    status: 'assigned', hoursAgo: 6,
    assignedVolunteerIndex: 2,
  },

  // ----- Annur (asha 2: Meena) -----
  {
    ashaIndex: 2, villageId: 'annur',
    needType: 'education', urgency: 'medium', language: 'en',
    rawQuote: 'Two girls dropped out of school last week',
    rawText: 'Two girls dropped out of school last week. Family says they cannot afford books.',
    beneficiaryCount: 2,
    locationHint: 'Annur',
    reasoning: 'Education access loss for two girls; needs counselling + book support.',
    status: 'verified', hoursAgo: 40, resolvedHoursLater: 18,
    photoUrl: pickPhoto('education'), verificationConfidence: 0.74,
    verificationReason: 'Photo shows girls back in classroom with books.',
    assignedVolunteerIndex: 6,
  },
  {
    ashaIndex: 2, villageId: 'annur',
    needType: 'sanitation', urgency: 'high', language: 'en',
    rawQuote: 'Open drain near bus stand has been overflowing for a week',
    rawText: 'Open drain near bus stand has been overflowing for a week, mosquito breeding heavily.',
    locationHint: 'Annur bus stand',
    reasoning: 'Standing water + overflow risks dengue/malaria outbreak; municipal escalation.',
    status: 'verified', hoursAgo: 26, resolvedHoursLater: 12,
    photoUrl: pickPhoto('sanitation'), verificationConfidence: 0.82,
    verificationReason: 'Photo shows cleared drain with water flowing properly.',
    assignedVolunteerIndex: 5,
  },
  {
    ashaIndex: 2, villageId: 'annur',
    needType: 'safety', urgency: 'high', language: 'ta',
    rawQuote: 'street light verala 2 weeks-a',
    rawText: 'Annur main street light 5 verala 2 weeks-a, ladies-ku night-la pora paya.',
    locationHint: 'Annur main street',
    reasoning: 'Unlit street creates safety risk especially for women.',
    status: 'verified', hoursAgo: 60, resolvedHoursLater: 24,
    photoUrl: pickPhoto('safety'), verificationConfidence: 0.78,
    verificationReason: 'Photo shows working street light at night.',
    assignedVolunteerIndex: 5,
  },
  {
    ashaIndex: 2, villageId: 'annur',
    needType: 'health', urgency: 'critical', language: 'ta',
    rawQuote: 'oru ammaa-ku snake bite',
    rawText: 'Annur ward 2-la oru ammaa-ku snake bite, hospital-ku porandhirukku, family panathukku poratam.',
    beneficiaryCount: 1,
    locationHint: 'Annur ward 2',
    reasoning: 'Snake bite emergency; family needs medical aid + financial support.',
    status: 'verified', hoursAgo: 16, resolvedHoursLater: 4,
    photoUrl: pickPhoto('health'), verificationConfidence: 0.91,
    verificationReason: 'Photo shows patient receiving anti-venom treatment.',
    assignedVolunteerIndex: 6,
  },
  {
    ashaIndex: 2, villageId: 'annur',
    needType: 'infrastructure', urgency: 'medium', language: 'en',
    rawQuote: 'road has 4 large potholes',
    rawText: 'Annur-Mettupalayam road has 4 large potholes near the school crossing.',
    locationHint: 'Annur school crossing',
    reasoning: 'Potholes near school crossing risk accidents.',
    status: 'in_progress', hoursAgo: 9,
    assignedVolunteerIndex: 5,
  },
  {
    ashaIndex: 2, villageId: 'annur',
    needType: 'food', urgency: 'low', language: 'en',
    rawQuote: 'noon meal scheme not consistent',
    rawText: 'Annur primary school noon meal scheme not consistent, some days only rice.',
    locationHint: 'Annur primary school',
    reasoning: 'Mid-day meal quality lapse; admin escalation.',
    status: 'open', hoursAgo: 30,
  },

  // ----- Mettupalayam (asha 3: Saraswati) -----
  {
    ashaIndex: 3, villageId: 'mettupalayam',
    needType: 'shelter', urgency: 'high', language: 'ta',
    rawQuote: 'old man-ku veedu illa',
    rawText: 'Mettupalayam corner-la oru old man-ku veedu illa, road-la padikuradhu.',
    beneficiaryCount: 1,
    locationHint: 'Mettupalayam',
    reasoning: 'Homeless elderly needs urgent shelter placement.',
    status: 'verified', hoursAgo: 24, resolvedHoursLater: 8,
    photoUrl: pickPhoto('shelter'), verificationConfidence: 0.84,
    verificationReason: 'Photo shows elderly man at shelter with bedding.',
    assignedVolunteerIndex: 7,
  },
  {
    ashaIndex: 3, villageId: 'mettupalayam',
    needType: 'health', urgency: 'high', language: 'hi',
    rawQuote: 'TB ke patient ki dawai khatam',
    rawText: 'Ek TB ke patient ki dawai khatam ho gayi, refill chahiye urgent.',
    beneficiaryCount: 1,
    locationHint: 'Mettupalayam ward 4',
    reasoning: 'Interrupted TB treatment risks resistance; medicine refill urgent.',
    status: 'verified', hoursAgo: 20, resolvedHoursLater: 5,
    photoUrl: pickPhoto('health'), verificationConfidence: 0.86,
    verificationReason: 'Photo shows DOTS card + medicine refill.',
    assignedVolunteerIndex: 6,
  },
  {
    ashaIndex: 3, villageId: 'mettupalayam',
    needType: 'water', urgency: 'medium', language: 'en',
    rawQuote: 'tap water has rust colour',
    rawText: 'Tap water in Mettupalayam ward 5 has rust colour, residents are buying from shops.',
    locationHint: 'Mettupalayam ward 5',
    reasoning: 'Contaminated water supply needs pipe inspection.',
    status: 'verified', hoursAgo: 48, resolvedHoursLater: 18,
    photoUrl: pickPhoto('water'), verificationConfidence: 0.71,
    verificationReason: 'Photo shows clean tap water flowing after pipe replacement.',
    assignedVolunteerIndex: 0,
  },
  {
    ashaIndex: 3, villageId: 'mettupalayam',
    needType: 'education', urgency: 'medium', language: 'en',
    rawQuote: 'high school maths teacher transferred',
    rawText: 'High school maths teacher transferred 2 weeks ago, no replacement yet.',
    locationHint: 'Mettupalayam high school',
    reasoning: 'Teacher gap affecting Class 10 students before exams.',
    status: 'open', hoursAgo: 11,
  },
  {
    ashaIndex: 3, villageId: 'mettupalayam',
    needType: 'food', urgency: 'medium', language: 'ta',
    rawQuote: 'anganwadi-la kuzhandhai-kku biscuit varala',
    rawText: 'Anganwadi 5-la kuzhandhai-kku biscuit varala 1 week-a.',
    locationHint: 'Anganwadi 5 Mettupalayam',
    reasoning: 'Supplementary nutrition gap for under-5 children.',
    status: 'verified', hoursAgo: 30, resolvedHoursLater: 14,
    photoUrl: pickPhoto('food'), verificationConfidence: 0.77,
    verificationReason: 'Photo shows nutrition supplies arrived at anganwadi.',
    assignedVolunteerIndex: 7,
  },
  {
    ashaIndex: 3, villageId: 'mettupalayam',
    needType: 'sanitation', urgency: 'low', language: 'ta',
    rawQuote: 'toilet door odanjirukku',
    rawText: 'Public toilet door odanjirukku, ladies-ku problem.',
    locationHint: 'Mettupalayam bus stand',
    reasoning: 'Broken toilet door reduces dignity + safety.',
    status: 'assigned', hoursAgo: 7,
    assignedVolunteerIndex: 5,
  },

  // ----- Karamadai (asha 4: Kavitha) -----
  {
    ashaIndex: 4, villageId: 'karamadai',
    needType: 'water', urgency: 'critical', language: 'ta',
    rawQuote: 'borewell motor odanjirukku',
    rawText: 'Karamadai colony-la borewell motor odanjirukku, 50 veedu kudi tannir illa.',
    beneficiaryCount: 200,
    locationHint: 'Karamadai colony',
    reasoning: '50 households without drinking water; motor repair urgent.',
    status: 'verified', hoursAgo: 22, resolvedHoursLater: 5,
    photoUrl: pickPhoto('water'), verificationConfidence: 0.93,
    verificationReason: 'Photo shows replaced borewell motor with water flowing.',
    assignedVolunteerIndex: 8,
  },
  {
    ashaIndex: 4, villageId: 'karamadai',
    needType: 'health', urgency: 'critical', language: 'hi',
    rawQuote: 'pregnant woman blood needed',
    rawText: 'Pregnant woman ko O+ blood urgent chahiye, government hospital mein.',
    beneficiaryCount: 1,
    locationHint: 'Karamadai government hospital',
    reasoning: 'Obstetric emergency; blood donor coordination.',
    status: 'verified', hoursAgo: 8, resolvedHoursLater: 2,
    photoUrl: pickPhoto('health'), verificationConfidence: 0.87,
    verificationReason: 'Photo shows blood donor at hospital.',
    assignedVolunteerIndex: 8,
  },
  {
    ashaIndex: 4, villageId: 'karamadai',
    needType: 'sanitation', urgency: 'high', language: 'en',
    rawQuote: 'dead animal carcass on road',
    rawText: 'Dead animal carcass on Karamadai junction road for 3 days, smell + flies.',
    locationHint: 'Karamadai junction',
    reasoning: 'Public health hazard from decomposing animal; immediate removal.',
    status: 'verified', hoursAgo: 14, resolvedHoursLater: 4,
    photoUrl: pickPhoto('sanitation'), verificationConfidence: 0.81,
    verificationReason: 'Photo shows cleared road with disinfectant applied.',
    assignedVolunteerIndex: 8,
  },
  {
    ashaIndex: 4, villageId: 'karamadai',
    needType: 'education', urgency: 'high', language: 'ta',
    rawQuote: 'special needs kuzhandhai-kku school illa',
    rawText: 'Karamadai-la special needs kuzhandhai-kku school illa, oru parent ennai keturukku.',
    beneficiaryCount: 1,
    locationHint: 'Karamadai',
    reasoning: 'Special education access gap for differently-abled child.',
    status: 'in_progress', hoursAgo: 13,
    assignedVolunteerIndex: 9,
  },
  {
    ashaIndex: 4, villageId: 'karamadai',
    needType: 'safety', urgency: 'medium', language: 'en',
    rawQuote: 'compound wall of school is broken',
    rawText: 'Compound wall of Karamadai panchayat school is broken in two places, stray dogs entering.',
    locationHint: 'Karamadai panchayat school',
    reasoning: 'Broken school wall + stray dogs = child safety risk.',
    status: 'open', hoursAgo: 5,
  },

  // ----- Cross-village additions to reach 47 -----
  {
    ashaIndex: 0, villageId: 'pollachi',
    needType: 'health', urgency: 'medium', language: 'ta',
    rawQuote: 'oru kuzhandhai-kku diarrhea',
    rawText: 'Oru kuzhandhai-kku diarrhea 3 days, ORS varala.',
    beneficiaryCount: 1,
    locationHint: 'Pollachi ward 5',
    reasoning: 'Pediatric diarrhea + missing ORS; rehydration + supplies.',
    status: 'verified', hoursAgo: 19, resolvedHoursLater: 3,
    photoUrl: pickPhoto('health'), verificationConfidence: 0.85,
    verificationReason: 'Photo shows child receiving ORS.',
    assignedVolunteerIndex: 1,
  },
  {
    ashaIndex: 0, villageId: 'pollachi',
    needType: 'food', urgency: 'low', language: 'ta',
    rawQuote: 'amma kitchen garden start panrom',
    rawText: 'Amma women SHG kitchen garden start panrom, seeds chahiye.',
    locationHint: 'Pollachi SHG centre',
    reasoning: 'SHG nutrition initiative; non-urgent seeds support.',
    status: 'open', hoursAgo: 17,
  },
  {
    ashaIndex: 1, villageId: 'sulur',
    needType: 'shelter', urgency: 'medium', language: 'en',
    rawQuote: 'window broken at PHC',
    rawText: 'Window broken at Sulur PHC waiting area, rain coming inside.',
    locationHint: 'Sulur PHC',
    reasoning: 'Repairs needed at health facility for patient comfort.',
    status: 'verified', hoursAgo: 42, resolvedHoursLater: 20,
    photoUrl: pickPhoto('shelter'), verificationConfidence: 0.79,
    verificationReason: 'Photo shows replaced window glass at PHC.',
    assignedVolunteerIndex: 3,
  },
  {
    ashaIndex: 1, villageId: 'sulur',
    needType: 'water', urgency: 'low', language: 'ta',
    rawQuote: 'pump-ku weekly maintenance illa',
    rawText: 'Sulur water pump-ku weekly maintenance illa, sometimes pressure low.',
    locationHint: 'Sulur water pump station',
    reasoning: 'Routine maintenance gap.',
    status: 'open', hoursAgo: 25,
  },
  {
    ashaIndex: 2, villageId: 'annur',
    needType: 'water', urgency: 'high', language: 'ta',
    rawQuote: 'pillaiyar koil paksamaaga thanni illa',
    rawText: 'Pillaiyar koil paksamaaga thanni illa 4 naal-a.',
    locationHint: 'Annur Pillaiyar temple area',
    reasoning: 'Water shortage in 4 households for 4 days.',
    status: 'verified', hoursAgo: 30, resolvedHoursLater: 9,
    photoUrl: pickPhoto('water'), verificationConfidence: 0.74,
    verificationReason: 'Photo shows water tanker delivery in the area.',
    assignedVolunteerIndex: 4,
  },
  {
    ashaIndex: 2, villageId: 'annur',
    needType: 'health', urgency: 'high', language: 'hi',
    rawQuote: 'mosquito fogging chahiye',
    rawText: 'Annur ke saare ward mein mosquito fogging chahiye, dengue cases barhe hain.',
    locationHint: 'Annur (multiple wards)',
    reasoning: 'Dengue surge requires fogging campaign.',
    status: 'verified', hoursAgo: 50, resolvedHoursLater: 22,
    photoUrl: pickPhoto('health'), verificationConfidence: 0.83,
    verificationReason: 'Photo shows fogging machine deployed in residential area.',
    assignedVolunteerIndex: 6,
  },
  {
    ashaIndex: 2, villageId: 'annur',
    needType: 'shelter', urgency: 'high', language: 'en',
    rawQuote: 'tribal family living in tent',
    rawText: 'Tribal family of 4 living in plastic tent for 1 month, monsoon coming.',
    beneficiaryCount: 4,
    locationHint: 'Annur outskirts',
    reasoning: 'Vulnerable family before monsoon needs proper shelter.',
    status: 'in_progress', hoursAgo: 12,
    assignedVolunteerIndex: 7,
  },
  {
    ashaIndex: 3, villageId: 'mettupalayam',
    needType: 'safety', urgency: 'medium', language: 'en',
    rawQuote: 'no police helpline number displayed',
    rawText: 'Mettupalayam panchayat office has no police helpline number displayed.',
    locationHint: 'Mettupalayam panchayat office',
    reasoning: 'Public information gap; helpline display campaign.',
    status: 'open', hoursAgo: 33,
  },
  {
    ashaIndex: 3, villageId: 'mettupalayam',
    needType: 'health', urgency: 'medium', language: 'en',
    rawQuote: 'mental health counselling needed',
    rawText: 'Mental health counselling needed for women SHG members, 5 reported anxiety.',
    beneficiaryCount: 5,
    locationHint: 'Mettupalayam SHG',
    reasoning: 'Mental health support for women SHG; counsellor visit.',
    status: 'assigned', hoursAgo: 4,
    assignedVolunteerIndex: 6,
  },
  {
    ashaIndex: 3, villageId: 'mettupalayam',
    needType: 'sanitation', urgency: 'medium', language: 'ta',
    rawQuote: 'cattle waste illogically disposed',
    rawText: 'Cattle waste illogically disposed in stream behind houses, smell unbearable.',
    locationHint: 'Mettupalayam stream area',
    reasoning: 'Improper waste disposal; awareness + alternative pit.',
    status: 'verified', hoursAgo: 70, resolvedHoursLater: 30,
    photoUrl: pickPhoto('sanitation'), verificationConfidence: 0.72,
    verificationReason: 'Photo shows new compost pit constructed.',
    assignedVolunteerIndex: 3,
  },
  {
    ashaIndex: 4, villageId: 'karamadai',
    needType: 'food', urgency: 'high', language: 'ta',
    rawQuote: 'oru widow-ku monthly pension delayed',
    rawText: 'Oru widow-ku monthly pension 2 maasam-a delayed, food panrathukku siramam.',
    beneficiaryCount: 1,
    locationHint: 'Karamadai',
    reasoning: 'Widow pension lapse; food security at risk.',
    status: 'verified', hoursAgo: 27, resolvedHoursLater: 11,
    photoUrl: pickPhoto('food'), verificationConfidence: 0.78,
    verificationReason: 'Photo shows ration kit handed to widow.',
    assignedVolunteerIndex: 7,
  },
  {
    ashaIndex: 4, villageId: 'karamadai',
    needType: 'infrastructure', urgency: 'medium', language: 'en',
    rawQuote: 'public bus shelter has no roof',
    rawText: 'Public bus shelter has no roof, women wait in sun + rain.',
    locationHint: 'Karamadai bus stop',
    reasoning: 'Inadequate public infrastructure; passenger safety in monsoon.',
    status: 'open', hoursAgo: 38,
  },
  {
    ashaIndex: 4, villageId: 'karamadai',
    needType: 'education', urgency: 'low', language: 'ta',
    rawQuote: 'teacher absenteeism high',
    rawText: 'Karamadai middle school-la teacher absenteeism kammi panala.',
    locationHint: 'Karamadai middle school',
    reasoning: 'School quality issue; admin escalation.',
    status: 'open', hoursAgo: 45,
  },
  {
    ashaIndex: 4, villageId: 'karamadai',
    needType: 'health', urgency: 'high', language: 'ta',
    rawQuote: 'oru kuzhandhai-kku malnutrition',
    rawText: 'Oru 3 vayasu kuzhandhai-kku severe malnutrition, anganwadi sappadu seriya varala.',
    beneficiaryCount: 1,
    locationHint: 'Karamadai anganwadi 1',
    reasoning: 'Severe acute malnutrition in toddler; nutrition rehab + medical.',
    status: 'verified', hoursAgo: 17, resolvedHoursLater: 5,
    photoUrl: pickPhoto('health'), verificationConfidence: 0.88,
    verificationReason: 'Photo shows child receiving therapeutic food at NRC.',
    assignedVolunteerIndex: 8,
  },
  {
    ashaIndex: 0, villageId: 'pollachi',
    needType: 'water', urgency: 'medium', language: 'ta',
    rawQuote: 'school water filter odanjirukku',
    rawText: 'Pollachi government primary school water filter odanjirukku 2 weeks-a.',
    locationHint: 'Pollachi government primary school',
    reasoning: 'No clean drinking water at school for students.',
    status: 'verified', hoursAgo: 36, resolvedHoursLater: 13,
    photoUrl: pickPhoto('water'), verificationConfidence: 0.80,
    verificationReason: 'Photo shows newly installed water purifier at school.',
    assignedVolunteerIndex: 0,
  },
  {
    ashaIndex: 1, villageId: 'sulur',
    needType: 'safety', urgency: 'medium', language: 'en',
    rawQuote: 'broken footpath near temple',
    rawText: 'Broken footpath near Sulur temple, elderly people slipping.',
    locationHint: 'Sulur temple road',
    reasoning: 'Pedestrian safety risk for elderly; footpath repair.',
    status: 'open', hoursAgo: 21,
  },
  {
    ashaIndex: 2, villageId: 'annur',
    needType: 'food', urgency: 'medium', language: 'ta',
    rawQuote: 'angeneadi-la cooking gas illa',
    rawText: 'Anganwadi-la cooking gas cylinder over, sappadu prepare panna mudiyala.',
    locationHint: 'Annur anganwadi 2',
    reasoning: 'Cooking gas exhausted; meal preparation halted.',
    status: 'verified', hoursAgo: 44, resolvedHoursLater: 8,
    photoUrl: pickPhoto('food'), verificationConfidence: 0.82,
    verificationReason: 'Photo shows new gas cylinder delivered at anganwadi.',
    assignedVolunteerIndex: 3,
  },
];
