/**
 * Host onboarding validation. T4.1 — Zod schema for all Host fields from Onboarding doc.
 */

import { z } from 'zod';

const accommodationType = z.enum(['Live-In', 'Live-Out', 'Either']).optional();
const travelExpectation = z.enum(['None', 'Occasional', 'Frequent Travel with Family']).optional();
const contractType = z.enum(['Part time', 'Full time', 'Seasonal']).optional();
const parentingStyle = z.enum(['Gentle', 'Balanced', 'Structured']).optional();
const salaryRange = z.enum(['€1000-€2000', '€2000-€4000', '€4000+']).optional();
const trialPeriod = z.enum(['2 weeks', '1 month', 'No trial']).optional();
const smokingPolicy = z.enum(['No smoking', 'Outdoor only', 'Flexible']).optional();

const hourOptions = z.array(z.enum(['Morning', 'Afternoon', 'Evening', 'Overnight'])).optional();
const dayOptions = z.array(z.string()).optional(); // Mon–Sun
const ageGroups = z.array(z.string()).optional(); // Infant, Toddler, School age, Teen
const languageLevel = z.enum(['Mother tongue', 'Conversational', 'Basic']).optional();

export const hostOnboardingSchema = z.object({
  userId: z.string().optional(),
  // Profile
  firstName: z.string().min(1, 'First name is required').optional().or(z.literal('')),
  lastName: z.string().min(1, 'Last name is required').optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  profileImageUrl: z.string().url().optional().or(z.literal('')),
  // Contact
  streetAndNumber: z.string().optional(),
  postcode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  // Location and living
  jobLocationCountry: z.string().optional(),
  jobLocationPlace: z.string().optional(),
  accommodationType,
  householdLanguages: z.union([z.string(), z.array(z.string())]).optional(),
  travelExpectations: travelExpectation,
  childrenAndAges: z.string().optional(),
  // Schedule
  desiredStartDate: z.string().optional(),
  finishDate: z.string().optional(),
  finishDateOngoing: z.boolean().optional(),
  requiredHours: hourOptions,
  weekendsRequired: z.boolean().optional(),
  requiredDays: dayOptions,
  // Childcare needs
  ageGroupExperienceRequired: ageGroups,
  specialNeedsCare: z.boolean().optional(),
  maxChildren: z.number().min(1).max(5).optional(),
  // Skills expected
  cookingForChildren: z.boolean().optional(),
  tutoringHomework: z.boolean().optional(),
  driving: z.boolean().optional(),
  travelAssistance: z.boolean().optional(),
  lightHousekeeping: z.boolean().optional(),
  // Language
  primaryLanguageRequired: z.string().optional(),
  primaryLanguageLevel: languageLevel,
  languageSpokenWithChildren: z.string().optional(),
  languageSpokenWithChildrenLevel: languageLevel,
  // Lifestyle
  petsInHome: z.boolean().optional(),
  smokingPolicy,
  strongReligiousBeliefs: z.boolean().optional(),
  parentingStyle,
  // Dietary
  dietaryPreferences: z.array(z.string()).optional(),
  nannyFollowDietary: z.boolean().optional(),
  // Compensation
  monthlySalaryRange: salaryRange,
  preferredContractType: contractType,
  trialPeriodPreference: trialPeriod,
  // About
  aboutFamily: z.string().optional(),
});

export type HostOnboardingInput = z.infer<typeof hostOnboardingSchema>;

/** Segment definitions for submitting host onboarding in parts. Keys must match hostOnboardingSchema. */
export const HOST_ONBOARDING_SEGMENTS = [
  { id: 'profile', title: 'Profile Info', keys: ['firstName', 'lastName', 'dateOfBirth', 'profileImageUrl'] as const },
  { id: 'contact', title: 'Contact Details', keys: ['streetAndNumber', 'postcode', 'city', 'country', 'phone'] as const },
  { id: 'location', title: 'Location and living setup', keys: ['jobLocationCountry', 'jobLocationPlace', 'accommodationType', 'householdLanguages', 'travelExpectations', 'childrenAndAges'] as const },
  { id: 'schedule', title: 'Schedule & Required Days', keys: ['desiredStartDate', 'finishDate', 'finishDateOngoing', 'requiredHours', 'weekendsRequired', 'requiredDays'] as const },
  { id: 'childcare', title: 'Childcare needs', keys: ['ageGroupExperienceRequired', 'specialNeedsCare', 'maxChildren'] as const },
  { id: 'skills', title: 'Skills and responsibilities', keys: ['cookingForChildren', 'tutoringHomework', 'driving', 'travelAssistance', 'lightHousekeeping'] as const },
  { id: 'language', title: 'Language skills', keys: ['primaryLanguageRequired', 'primaryLanguageLevel', 'languageSpokenWithChildren', 'languageSpokenWithChildrenLevel'] as const },
  { id: 'lifestyle', title: 'Lifestyle and household', keys: ['petsInHome', 'smokingPolicy', 'strongReligiousBeliefs', 'parentingStyle', 'dietaryPreferences', 'nannyFollowDietary'] as const },
  { id: 'compensation', title: 'Compensation and contract', keys: ['monthlySalaryRange', 'preferredContractType', 'trialPeriodPreference'] as const },
  { id: 'about', title: 'Write a few words about you', keys: ['aboutFamily'] as const },
] as const;

export type HostOnboardingSegmentId = (typeof HOST_ONBOARDING_SEGMENTS)[number]['id'];

/** Validate only the fields for a given segment. Returns partial data for that segment. */
export function validateHostOnboardingSegment(
  segmentId: HostOnboardingSegmentId,
  data: unknown
): { success: true; data: Partial<HostOnboardingInput> } | { success: false; error: z.ZodError } {
  const segment = HOST_ONBOARDING_SEGMENTS.find((s) => s.id === segmentId);
  if (!segment) return { success: false, error: new z.ZodError([{ code: 'custom', path: [], message: 'Unknown segment' }]) as z.ZodError };
  const raw = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {};
  const picked: Record<string, unknown> = {};
  for (const k of segment.keys) {
    if (k in raw) picked[k] = raw[k];
  }
  const result = hostOnboardingSchema.partial().safeParse(picked);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
}

/** Validate and strip unknown keys for Airtable. */
export function validateHostOnboarding(data: unknown): { success: true; data: HostOnboardingInput } | { success: false; error: z.ZodError } {
  const result = hostOnboardingSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
}
