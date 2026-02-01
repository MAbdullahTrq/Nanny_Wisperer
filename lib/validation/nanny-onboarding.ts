/**
 * Nanny onboarding validation. T4.2 — Zod schema for all Nanny fields from Onboarding doc.
 */

import { z } from 'zod';

const contractType = z.enum(['Part time', 'Full time', 'Seasonal']).optional();
const parentingStyle = z.enum(['Gentle', 'Balanced', 'Structured']).optional();
const badge = z.enum(['Basic', 'Verified', 'Certified']).optional();
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
  preferredContractType: contractType,
  preferredDaysOff: dayOptions,
  // About
  aboutMe: z.string().optional(),
  badge,
});

export type NannyOnboardingInput = z.infer<typeof nannyOnboardingSchema>;

/** Validate and strip unknown keys for Airtable. */
export function validateNannyOnboarding(data: unknown): { success: true; data: NannyOnboardingInput } | { success: false; error: z.ZodError } {
  const result = nannyOnboardingSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
}
