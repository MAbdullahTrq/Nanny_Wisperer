/**
 * Nanny onboarding validation. T4.2 — Zod schema for all Nanny fields from Onboarding doc.
 */

import { z } from 'zod';

const contractType = z.enum(['Part time', 'Full time', 'Seasonal']).optional();
const parentingStyle = z.enum(['Gentle', 'Balanced', 'Structured']).optional();
const badge = z.enum(['Basic', 'Verified', 'Certified']).optional();
const nannyType = z.enum(['Nanny', 'Au Pair']).optional();
const hourOptions = z.array(z.enum(['Morning', 'Afternoon', 'Evening', 'Overnight'])).optional();
const dayOptions = z.array(z.string()).optional();
const ageGroups = z.array(z.string()).optional(); // 0-2, 3-6, 7-12, Teens

export const nannyOnboardingSchema = z.object({
  userId: z.string().optional(),
  // Profile
  firstName: z.string().min(1, 'First name is required').optional().or(z.literal('')),
  lastName: z.string().min(1, 'Last name is required').optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  profileImageUrl: z.string().url().optional().or(z.literal('')),
  // Contact
  streetAndNumber: z.string().optional(),
  postcode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  // About you
  currentLocation: z.string().optional(),
  nationality: z.string().optional(),
  hasChildcareExperience: z.boolean().optional(),
  hasDrivingLicence: z.boolean().optional(),
  vegetarianOrVegan: z.boolean().optional(),
  // Language skills (stored as JSON string or object)
  languageSkills: z.union([z.string(), z.record(z.string())]).optional(),
  // Location preferences (array of { country, citiesOrPlaces } or JSON string)
  locationPreferences: z.union([z.string(), z.array(z.object({ country: z.string(), citiesOrPlaces: z.string() }))]).optional(),
  // Schedule & availability
  availableStartDate: z.string().optional(),
  finishDate: z.string().optional(),
  finishDateOngoing: z.boolean().optional(),
  availableHours: hourOptions,
  availableWeekends: z.boolean().optional(),
  availableDays: dayOptions,
  // Experience
  yearsChildcareExperience: z.number().min(0).optional(),
  ageGroupsWorkedWith: ageGroups,
  specialNeedsExperience: z.boolean().optional(),
  specialNeedsDetails: z.string().optional(),
  maxChildrenComfortable: z.number().min(1).max(5).optional(),
  // Skills
  canCook: z.boolean().optional(),
  tutoringHomework: z.boolean().optional(),
  lightHousekeeping: z.boolean().optional(),
  okToTravelAndSupport: z.boolean().optional(),
  // Lifestyle
  comfortableWithPets: z.boolean().optional(),
  smokes: z.boolean().optional(),
  strongReligiousBeliefs: z.boolean().optional(),
  parentingStylePreference: parentingStyle,
  // Dietary
  dietaryRestrictions: z.boolean().optional(),
  dietaryDetails: z.string().optional(),
  willingToCookNonVegetarian: z.boolean().optional(),
  // Compensation
  expectedMonthlySalaryNet: z.union([z.string(), z.number()]).optional(),
  expectedWeeklyPocketMoney: z.union([z.string(), z.number()]).optional(),
  euAuPairHoursAcknowledged: z.boolean().optional(),
  preferredContractType: contractType,
  preferredDaysOff: dayOptions,
  // About
  aboutMe: z.string().optional(),
  badge,
  nannyType,
});

export type NannyOnboardingInput = z.infer<typeof nannyOnboardingSchema>;

/** Segment definitions for submitting nanny onboarding in parts. Keys must match nannyOnboardingSchema. */
export const NANNY_ONBOARDING_SEGMENTS = [
  { id: 'profile', title: 'Profile Info', keys: ['firstName', 'lastName', 'dateOfBirth', 'gender', 'profileImageUrl', 'nannyType'] as const },
  { id: 'contact', title: 'Contact Details', keys: ['streetAndNumber', 'postcode', 'city', 'country', 'phone'] as const },
  { id: 'about', title: 'About You', keys: ['currentLocation', 'nationality', 'hasChildcareExperience', 'hasDrivingLicence', 'smokes', 'vegetarianOrVegan'] as const },
  { id: 'language', title: 'Language skills', keys: ['languageSkills'] as const },
  { id: 'locationPrefs', title: 'Location Preferences', keys: ['locationPreferences'] as const },
  { id: 'schedule', title: 'Schedule & Availability', keys: ['availableStartDate', 'finishDate', 'finishDateOngoing', 'availableHours', 'availableWeekends', 'availableDays', 'euAuPairHoursAcknowledged'] as const },
  { id: 'experience', title: 'Experience', keys: ['yearsChildcareExperience', 'ageGroupsWorkedWith', 'specialNeedsExperience', 'specialNeedsDetails', 'maxChildrenComfortable'] as const },
  { id: 'skills', title: 'Skills And Responsibilities', keys: ['canCook', 'tutoringHomework', 'lightHousekeeping', 'okToTravelAndSupport'] as const },
  { id: 'lifestyle', title: 'Lifestyle And Values', keys: ['comfortableWithPets', 'smokes', 'strongReligiousBeliefs', 'parentingStylePreference'] as const },
  { id: 'dietary', title: 'Dietary Requirements', keys: ['dietaryRestrictions', 'dietaryDetails', 'willingToCookNonVegetarian'] as const },
  { id: 'compensation', title: 'Compensation And Agreement', keys: ['expectedMonthlySalaryNet', 'expectedWeeklyPocketMoney', 'preferredContractType', 'preferredDaysOff'] as const },
  { id: 'aboutMe', title: 'Write a few words about you', keys: ['aboutMe'] as const },
] as const;

export type NannyOnboardingSegmentId = (typeof NANNY_ONBOARDING_SEGMENTS)[number]['id'];

/** Validate only the fields for a given segment. Returns partial data for that segment. */
export function validateNannyOnboardingSegment(
  segmentId: NannyOnboardingSegmentId,
  data: unknown
): { success: true; data: Partial<NannyOnboardingInput> } | { success: false; error: z.ZodError } {
  const segment = NANNY_ONBOARDING_SEGMENTS.find((s) => s.id === segmentId);
  if (!segment) return { success: false, error: new z.ZodError([{ code: 'custom', path: [], message: 'Unknown segment' }]) as z.ZodError };
  const raw = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {};
  const picked: Record<string, unknown> = {};
  for (const k of segment.keys) {
    if (k in raw) picked[k] = raw[k];
  }
  const result = nannyOnboardingSchema.partial().safeParse(picked);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
}

/** Validate and strip unknown keys for Airtable. */
export function validateNannyOnboarding(data: unknown): { success: true; data: NannyOnboardingInput } | { success: false; error: z.ZodError } {
  const result = nannyOnboardingSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
}
