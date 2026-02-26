/**
 * Map app camelCase field names to Airtable field names.
 * Airtable bases often use "Title with spaces" (e.g. "Date of birth") instead of camelCase.
 * Use this when writing to Hosts so both naming conventions work.
 */

const HOST_FIELD_TO_AIRTABLE: Record<string, string> = {
  userId: 'userId',
  firstName: 'First name',
  lastName: 'Last name',
  dateOfBirth: 'Date of birth',
  profileImageUrl: 'Profile image URL',
  streetAndNumber: 'Street and number',
  postcode: 'Postcode',
  city: 'City',
  country: 'Country',
  phone: 'Phone',
  jobLocationCountry: 'Job location country',
  jobLocationPlace: 'Job location place',
  accommodationType: 'Accommodation type',
  householdLanguages: 'Household languages',
  travelExpectations: 'Travel expectations',
  childrenAndAges: 'Children and ages',
  desiredStartDate: 'Desired start date',
  finishDate: 'Finish date',
  finishDateOngoing: 'Finish date ongoing',
  requiredHours: 'Required hours',
  weekendsRequired: 'Weekends required',
  requiredDays: 'Required days',
  ageGroupExperienceRequired: 'Age group experience required',
  specialNeedsCare: 'Special needs care',
  maxChildren: 'Max children',
  cookingForChildren: 'Cooking for children',
  tutoringHomework: 'Tutoring homework',
  driving: 'Driving',
  travelAssistance: 'Travel assistance',
  lightHousekeeping: 'Light housekeeping',
  primaryLanguageRequired: 'Primary language required',
  primaryLanguageLevel: 'Primary language level',
  languageSpokenWithChildren: 'Language spoken with children',
  languageSpokenWithChildrenLevel: 'Language spoken with children level',
  petsInHome: 'Pets in home',
  smokingPolicy: 'Smoking policy',
  strongReligiousBeliefs: 'Strong religious beliefs',
  parentingStyle: 'Parenting style',
  dietaryPreferences: 'Dietary preferences',
  nannyFollowDietary: 'Nanny follow dietary',
  monthlySalaryRange: 'Monthly salary range',
  preferredContractType: 'Preferred contract type',
  trialPeriodPreference: 'Trial period preference',
  aboutFamily: 'About family',
};

/** Reverse map: Airtable field name → app camelCase (for reading) */
const AIRTABLE_TO_HOST_FIELD: Record<string, string> = {};
for (const [k, v] of Object.entries(HOST_FIELD_TO_AIRTABLE)) {
  AIRTABLE_TO_HOST_FIELD[v] = k;
}

/**
 * Convert payload keys to Airtable field names. Keys not in the map are passed through as-is.
 */
export function hostFieldsToAirtable(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    const airtableKey = HOST_FIELD_TO_AIRTABLE[key] ?? key;
    out[airtableKey] = value;
  }
  return out;
}

/**
 * Convert Airtable response fields to app camelCase (for reading host records).
 */
export function airtableFieldsToHost(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    const appKey = AIRTABLE_TO_HOST_FIELD[key] ?? key;
    out[appKey] = value;
  }
  return out;
}
