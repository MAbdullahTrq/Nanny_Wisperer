/**
 * Airtable record types. Aligned with base structure and Onboarding doc.
 */

export type UserType = 'Host' | 'Nanny';

export interface User {
  id?: string;
  email: string;
  name?: string;
  userType: UserType;
  passwordHash?: string;
  ghlContactId?: string;
  airtableHostId?: string;
  airtableNannyId?: string;
  emailVerified?: boolean;
  createdTime?: string;
}

// —— Host (onboarding fields) ——
export type AccommodationType = 'Live-In' | 'Live-Out' | 'Either';
export type TravelExpectation = 'None' | 'Occasional' | 'Frequent Travel with Family';
export type ContractType = 'Part time' | 'Full time' | 'Seasonal';
export type ParentingStyle = 'Gentle' | 'Balanced' | 'Structured';
export type SalaryRange = '€1000-€2000' | '€2000-€4000' | '€4000+';
export type TrialPeriod = '2 weeks' | '1 month' | 'No trial';

export interface Host {
  id?: string;
  createdTime?: string;
  userId?: string; // link to Users
  location?: string; // convenience / matching (e.g. city or jobLocationPlace)
  tier?: string; // subscription tier (e.g. VIP) for matching
  // Profile
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  profileImageUrl?: string;
  // Contact
  streetAndNumber?: string;
  postcode?: string;
  city?: string;
  country?: string;
  phone?: string;
  // Location and living
  jobLocationCountry?: string;
  jobLocationPlace?: string;
  accommodationType?: AccommodationType;
  householdLanguages?: string | string[];
  travelExpectations?: TravelExpectation;
  childrenAndAges?: string;
  // Schedule
  desiredStartDate?: string;
  finishDate?: string;
  finishDateOngoing?: boolean;
  requiredHours?: string[]; // Morning, Afternoon, Evening, Overnight
  weekendsRequired?: boolean;
  requiredDays?: string[]; // Mon–Sun
  // Childcare needs
  ageGroupExperienceRequired?: string[]; // Infant, Toddler, School age, Teen
  specialNeedsCare?: boolean;
  maxChildren?: number;
  // Skills expected
  cookingForChildren?: boolean;
  tutoringHomework?: boolean;
  driving?: boolean;
  travelAssistance?: boolean;
  lightHousekeeping?: boolean;
  // Language
  primaryLanguageRequired?: string;
  primaryLanguageLevel?: string; // Mother tongue, Conversational, Basic
  languageSpokenWithChildren?: string;
  languageSpokenWithChildrenLevel?: string;
  // Lifestyle
  petsInHome?: boolean;
  smokingPolicy?: 'No smoking' | 'Outdoor only' | 'Flexible';
  strongReligiousBeliefs?: boolean;
  parentingStyle?: ParentingStyle;
  // Dietary
  dietaryPreferences?: string[];
  nannyFollowDietary?: boolean;
  // Compensation
  monthlySalaryRange?: SalaryRange;
  preferredContractType?: ContractType;
  trialPeriodPreference?: TrialPeriod;
  // About
  aboutFamily?: string;
  [key: string]: unknown;
}

// —— Nanny (onboarding fields) ——
export type NannyBadge = 'Basic' | 'Verified' | 'Certified';

export interface Nanny {
  id?: string;
  createdTime?: string;
  userId?: string;
  badge?: NannyBadge;
  location?: string; // convenience / matching (e.g. currentLocation or city)
  tier?: string; // Basic | Verified | Certified (alias for badge)
  // Profile
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  profileImageUrl?: string;
  // Contact
  streetAndNumber?: string;
  postcode?: string;
  city?: string;
  country?: string;
  phone?: string;
  // About
  currentLocation?: string;
  nationality?: string;
  hasChildcareExperience?: boolean;
  hasDrivingLicence?: boolean;
  vegetarianOrVegan?: boolean;
  // Language skills (stored as JSON or comma-separated)
  languageSkills?: string | Record<string, string>;
  // Location preferences
  locationPreferences?: string | Array<{ country: string; citiesOrPlaces: string }>;
  // Schedule & availability
  availableStartDate?: string;
  finishDate?: string;
  finishDateOngoing?: boolean;
  availableHours?: string[];
  availableWeekends?: boolean;
  availableDays?: string[];
  // Experience
  yearsChildcareExperience?: number;
  ageGroupsWorkedWith?: string[];
  specialNeedsExperience?: boolean;
  maxChildrenComfortable?: number;
  // Skills
  canCook?: boolean;
  tutoringHomework?: boolean;
  lightHousekeeping?: boolean;
  okToTravelAndSupport?: boolean;
  // Lifestyle
  comfortableWithPets?: boolean;
  smokes?: boolean;
  strongReligiousBeliefs?: boolean;
  parentingStylePreference?: ParentingStyle;
  // Dietary
  dietaryRestrictions?: boolean;
  dietaryDetails?: string;
  willingToCookNonVegetarian?: boolean;
  // Compensation
  expectedMonthlySalaryNet?: string | number;
  preferredContractType?: ContractType;
  preferredDaysOff?: string[];
  // About
  aboutMe?: string;
  [key: string]: unknown;
}

// —— Match (T3.2) ——
export type MatchStatus = 'pending' | 'shortlisted' | 'proceeded' | 'passed';

export interface Match {
  id?: string;
  createdTime?: string;
  hostId?: string;
  nannyId?: string;
  score?: number;
  hostProceed?: boolean;
  nannyProceed?: boolean;
  bothProceedAt?: string;
  status?: MatchStatus;
  [key: string]: unknown;
}

// —— Shortlist (T3.2) ——
export interface Shortlist {
  id?: string;
  createdTime?: string;
  hostId?: string;
  matchIds?: string[]; // linked record IDs
  deliveredAt?: string;
  [key: string]: unknown;
}

// —— Conversation (T7.1) ——
export interface Conversation {
  id?: string;
  createdTime?: string;
  matchId?: string;
  hostId?: string;
  nannyId?: string;
  [key: string]: unknown;
}

// —— Message (T7.1) ——
export type SenderType = 'Host' | 'Nanny';

export interface Message {
  id?: string;
  createdTime?: string;
  conversationId?: string;
  senderId?: string;
  senderType?: SenderType;
  content?: string;
  attachmentUrl?: string;
  [key: string]: unknown;
}

// —— InterviewRequest (T8.1) ——
export type InterviewRequestStatus =
  | 'pending_slots'
  | 'nanny_selected'
  | 'meeting_created'
  | 'none_available'
  | 'cancelled';

export interface InterviewRequest {
  id?: string;
  createdTime?: string;
  matchId?: string;
  hostId?: string;
  nannyId?: string;
  slot1?: string;
  slot2?: string;
  slot3?: string;
  slot4?: string;
  slot5?: string;
  selectedSlotIndex?: number;
  googleMeetLink?: string;
  googleCalendarEventId?: string;
  status?: InterviewRequestStatus;
  isVip?: boolean;
  [key: string]: unknown;
}

// —— GoogleCalendarTokens (T8.4) ——
export interface GoogleCalendarToken {
  id?: string;
  userId?: string;
  refreshToken?: string;
  calendarId?: string;
  updatedTime?: string;
  [key: string]: unknown;
}
