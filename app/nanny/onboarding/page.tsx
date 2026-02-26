'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Card } from '@/components/ui';
import {
  NANNY_ONBOARDING_SEGMENTS,
  type NannyOnboardingInput,
  type NannyOnboardingSegmentId,
} from '@/lib/validation/nanny-onboarding';
import { compressImage, MAX_PROFILE_IMAGE_BYTES, isImageFile, isHeicFile, convertHeicToJpeg } from '@/lib/image-compress';

const AVAILABLE_HOURS_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Overnight'] as const;
const AVAILABLE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const AGE_GROUPS = ['0-2', '3-6', '7-12', 'Teens'] as const;
const LANGUAGE_LEVELS = ['Mother tongue', 'Conversational', 'Basic'] as const;
const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch', 'Polish', 'Romanian',
  'Arabic', 'Mandarin Chinese', 'Hindi', 'Japanese', 'Korean', 'Turkish', 'Russian', 'Ukrainian',
  'Irish', 'Welsh', 'Scottish Gaelic', 'Other',
];
const PARENTING_STYLES = ['Gentle', 'Balanced', 'Structured'] as const;
const CONTRACT_TYPES = ['Part time', 'Full time', 'Seasonal'] as const;

const LANGUAGES_SET = new Set(LANGUAGES);

type LanguageSkillRow = { language: string; level: string; otherLanguage?: string };

function toRowLanguage(lang: string): Pick<LanguageSkillRow, 'language' | 'otherLanguage'> {
  const trimmed = lang.trim();
  if (!trimmed) return { language: '', otherLanguage: undefined };
  if (LANGUAGES_SET.has(trimmed)) return { language: trimmed, otherLanguage: undefined };
  return { language: 'Other', otherLanguage: trimmed };
}

function rowDisplayLanguage(row: LanguageSkillRow): string {
  if (row.language === 'Other' && row.otherLanguage) return row.otherLanguage;
  return row.language;
}

function parseLanguageSkills(value: string | Record<string, string> | undefined): LanguageSkillRow[] {
  if (value === undefined || value === '') return [{ language: '', level: '' }];
  if (typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value).map(([language, level]) => ({
      ...toRowLanguage(language),
      level: level || '',
    }));
  }
  const s = typeof value === 'string' ? value : '';
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((p: { language?: string; level?: string; otherLanguage?: string }) => ({
        language: p.language ?? '',
        level: p.level ?? '',
        otherLanguage: p.otherLanguage,
      }));
    }
  } catch {
    // not JSON
  }
  if (!s.trim()) return [{ language: '', level: '' }];
  const rows = s.split(',').map((part) => {
    const colon = part.indexOf(':');
    if (colon === -1) {
      const lang = part.trim();
      return { ...toRowLanguage(lang), level: '' };
    }
    const lang = part.slice(0, colon).trim();
    const level = part.slice(colon + 1).trim();
    return { ...toRowLanguage(lang), level };
  }).filter((r) => r.language || r.level || r.otherLanguage);
  return rows.length > 0 ? rows : [{ language: '', level: '' }];
}

function serializeLanguageSkills(rows: LanguageSkillRow[]): string {
  const filled = rows.filter((r) => rowDisplayLanguage(r).trim() || r.level.trim());
  if (filled.length === 0) return '';
  return filled.map((r) => {
    const name = rowDisplayLanguage(r);
    return r.level ? `${name}: ${r.level}` : name;
  }).join(', ');
}

/** At least one language with both language name and proficiency. */
function hasAtLeastOneLanguage(rows: LanguageSkillRow[]): boolean {
  return rows.some((r) => {
    const name = rowDisplayLanguage(r).trim();
    if (!name) return false;
    if (r.language === 'Other' && !(r.otherLanguage?.trim())) return false;
    return r.level.trim().length > 0;
  });
}

const defaultData: NannyOnboardingInput = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  profileImageUrl: '',
  nannyType: 'Nanny',
  streetAndNumber: '',
  postcode: '',
  city: '',
  country: '',
  phone: '',
  currentLocation: '',
  nationality: '',
  hasChildcareExperience: false,
  hasDrivingLicence: false,
  smokes: false,
  vegetarianOrVegan: false,
  languageSkills: '',
  locationPreferences: '',
  availableStartDate: '',
  finishDate: '',
  finishDateOngoing: false,
  availableHours: [],
  availableWeekends: false,
  availableDays: [],
  euAuPairHoursAcknowledged: false,
  yearsChildcareExperience: undefined,
  ageGroupsWorkedWith: [],
  specialNeedsExperience: false,
  specialNeedsDetails: '',
  maxChildrenComfortable: undefined,
  canCook: false,
  tutoringHomework: false,
  lightHousekeeping: false,
  okToTravelAndSupport: false,
  comfortableWithPets: false,
  strongReligiousBeliefs: false,
  parentingStylePreference: undefined,
  dietaryRestrictions: false,
  dietaryDetails: '',
  willingToCookNonVegetarian: false,
  expectedMonthlySalaryNet: '',
  expectedWeeklyPocketMoney: '',
  preferredContractType: undefined,
  preferredDaysOff: [],
  aboutMe: '',
};

function getSegmentPayload(segmentId: NannyOnboardingSegmentId, data: NannyOnboardingInput): Record<string, unknown> {
  const segment = NANNY_ONBOARDING_SEGMENTS.find((s) => s.id === segmentId);
  if (!segment) return {};
  const out: Record<string, unknown> = { segment: segmentId };
  for (const k of segment.keys) {
    const v = data[k as keyof NannyOnboardingInput];
    if (v === undefined) continue;
    if (typeof v === 'boolean' || Array.isArray(v)) {
      out[k] = v;
      continue;
    }
    if (v !== '') out[k] = v;
  }
  return out;
}

export default function NannyOnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<NannyOnboardingInput>(defaultData);
  const [loading, setLoading] = useState(false);
  const [savedSegment, setSavedSegment] = useState<NannyOnboardingSegmentId | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/nanny/onboarding');
      return;
    }
    if (status !== 'authenticated') return;
    fetch('/api/nanny/onboarding')
      .then((r) => r.json())
      .then((res) => {
        if (res.nanny && typeof res.nanny === 'object') {
          setData((prev) => ({ ...defaultData, ...prev, ...res.nanny }));
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [status, router]);

  const update = (key: keyof NannyOnboardingInput, value: unknown) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setError('');
    setSavedSegment(null);
  };

  const handleProfileImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    e.target.value = '';
    setImageUploadError('');
    if (!file) return;
    if (!isImageFile(file) && !isHeicFile(file)) {
      setImageUploadError('Please select an image file (JPEG, PNG, HEIC, etc.).');
      return;
    }
    if (file.size > MAX_PROFILE_IMAGE_BYTES) {
      setImageUploadError(`Image must be 20MB or smaller (current: ${(file.size / 1024 / 1024).toFixed(1)}MB).`);
      return;
    }
    setUploadingImage(true);
    try {
      if (isHeicFile(file)) {
        file = await convertHeicToJpeg(file);
      }
      const compressed = await compressImage(file, { targetSizeKb: 300 });
      const formData = new FormData();
      formData.append('file', compressed, file.name.replace(/\.[^.]+$/, '.jpg') || 'photo.jpg');
      const res = await fetch('/api/upload/profile-image', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        setImageUploadError(json.error || 'Upload failed.');
        return;
      }
      if (json.url) update('profileImageUrl', json.url);
    } catch {
      setImageUploadError('Failed to process or upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const saveSegment = async () => {
    const segmentId = NANNY_ONBOARDING_SEGMENTS[step]!.id;
    setLoading(true);
    setError('');
    if (segmentId === 'language') {
      const rows = parseLanguageSkills(data.languageSkills as string | Record<string, string> | undefined);
      if (!hasAtLeastOneLanguage(rows)) {
        setError('Please add at least one language and select a proficiency level.');
        setLoading(false);
        return;
      }
    }
    try {
      const payload = getSegmentPayload(segmentId, data);
      const res = await fetch('/api/nanny/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json.error || 'Something went wrong.';
        setError(json.detail ? `${msg} (${json.detail})` : msg);
        setLoading(false);
        return;
      }
      setSavedSegment(segmentId);
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const goToDashboard = () => router.push('/nanny/dashboard');

  if (status === 'loading' || fetching) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <p className="text-dark-green/80">Loading…</p>
      </div>
    );
  }

  const currentSegment = NANNY_ONBOARDING_SEGMENTS[step]!;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        {(data.nannyType ?? 'Nanny') === 'Au Pair' ? 'Au Pair' : 'Nanny'} profile
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">
        Step {step + 1} of {NANNY_ONBOARDING_SEGMENTS.length}: {currentSegment.title}
      </p>

      <div className="mb-4 flex gap-1 flex-wrap">
        {NANNY_ONBOARDING_SEGMENTS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(i)}
            className={`rounded-lg py-2 px-2 min-w-[2rem] text-sm font-medium transition-colors ${
              i === step ? 'bg-dark-green text-off-white' : 'bg-light-pink/50 text-dark-green hover:bg-light-pink'
            }`}
            title={s.title}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <Card className="p-6 mb-6 bg-light-pink/10 border-2 border-light-pink/40">
        {/* 1. Profile Info */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-dark-green mb-4">Profile Info</h2>
            <Input label="First Name" value={data.firstName ?? ''} onChange={(e) => update('firstName', e.target.value)} placeholder="First name" />
            <Input label="Last Name" value={data.lastName ?? ''} onChange={(e) => update('lastName', e.target.value)} placeholder="Last name" />
            <Input label="Date of birth" type="date" value={data.dateOfBirth ?? ''} onChange={(e) => update('dateOfBirth', e.target.value)} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pastel-black">Gender</label>
              <select value={data.gender ?? ''} onChange={(e) => update('gender', e.target.value)} className="w-full rounded-lg border border-light-green/60 bg-off-white px-3 py-2.5 text-pastel-black">
                <option value="">Select</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pastel-black">Profile image upload</label>
              <p className="text-xs text-dark-green/70 mb-1">Max 20MB. JPEG, PNG, HEIC (iPhone) supported. Image is resized and compressed to ~300 KB before upload.</p>
              <div className="flex flex-col gap-2">
                <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-light-green/60 bg-off-white/80 py-6 px-4 cursor-pointer hover:border-dark-green/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*,image/heic,image/heif,.heic,.heif"
                    className="hidden"
                    onChange={handleProfileImageFile}
                    disabled={uploadingImage}
                  />
                  {uploadingImage ? (
                    <span className="text-sm text-dark-green">Uploading…</span>
                  ) : (
                    <>
                      <svg className="w-10 h-10 text-dark-green/50 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-dark-green/80">Click to upload a photo (max 20MB)</span>
                    </>
                  )}
                </label>
                {data.profileImageUrl && (
                  <div className="flex items-center gap-2">
                    <img src={data.profileImageUrl} alt="Profile" className="h-16 w-16 rounded-lg object-cover border border-light-green/40" />
                    <span className="text-xs text-dark-green/70">Uploaded. Save this section to keep it.</span>
                  </div>
                )}
              </div>
              {imageUploadError && <p className="text-sm text-red-600 mt-1">{imageUploadError}</p>}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">I am signing up as</label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-dark-green">
                  <input type="radio" name="nannyType" value="Nanny" checked={(data.nannyType ?? 'Nanny') === 'Nanny'} onChange={() => update('nannyType', 'Nanny')} />
                  Nanny
                </label>
                <label className="flex items-center gap-2 text-sm text-dark-green">
                  <input type="radio" name="nannyType" value="Au Pair" checked={(data.nannyType ?? 'Nanny') === 'Au Pair'} onChange={() => update('nannyType', 'Au Pair')} />
                  Au Pair
                </label>
              </div>
              <p className="mt-1 text-xs text-dark-green/70">Au Pairs have a few different questions (e.g. EU hours, weekly pocket money).</p>
            </div>
          </div>
        )}

        {/* 2. Contact Details */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-dark-green mb-4">Contact Details</h2>
            <Input label="Street and house number" value={data.streetAndNumber ?? ''} onChange={(e) => update('streetAndNumber', e.target.value)} placeholder="Street and number" />
            <Input label="Postal Code" value={data.postcode ?? ''} onChange={(e) => update('postcode', e.target.value)} placeholder="Postcode" />
            <Input label="City" value={data.city ?? ''} onChange={(e) => update('city', e.target.value)} placeholder="City" />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pastel-black">Country</label>
              <select value={data.country ?? ''} onChange={(e) => update('country', e.target.value)} className="w-full rounded-lg border border-light-green/60 bg-off-white px-3 py-2.5 text-pastel-black">
                <option value="">Select country</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Ireland">Ireland</option>
                <option value="France">France</option>
                <option value="Germany">Germany</option>
                <option value="Spain">Spain</option>
                <option value="Italy">Italy</option>
                <option value="Netherlands">Netherlands</option>
                <option value="Belgium">Belgium</option>
                <option value="Switzerland">Switzerland</option>
                <option value="Austria">Austria</option>
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <Input label="Phone *" type="tel" value={data.phone ?? ''} onChange={(e) => update('phone', e.target.value)} placeholder="Phone" required />
          </div>
        )}

        {/* 3. About You */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-dark-green mb-4">About You</h2>
            <Input label="Where do you currently live" value={data.currentLocation ?? ''} onChange={(e) => update('currentLocation', e.target.value)} placeholder="City / country" />
            <Input label="Nationality" value={data.nationality ?? ''} onChange={(e) => update('nationality', e.target.value)} placeholder="Nationality" />
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={!!data.hasChildcareExperience} onChange={(e) => update('hasChildcareExperience', e.target.checked)} />
              I have childcare experience
            </label>
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={!!data.hasDrivingLicence} onChange={(e) => update('hasDrivingLicence', e.target.checked)} />
              I have a valid driving licence
            </label>
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={!!data.smokes} onChange={(e) => update('smokes', e.target.checked)} />
              I smoke
            </label>
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={!!data.vegetarianOrVegan} onChange={(e) => update('vegetarianOrVegan', e.target.checked)} />
              I am vegetarian or vegan
            </label>
          </div>
        )}

        {/* 4. Language skills */}
        {step === 3 && (() => {
          const rows = parseLanguageSkills(data.languageSkills as string | Record<string, string> | undefined);
          return (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-semibold text-dark-green mb-4">Language skills</h2>
              <p className="text-xs text-dark-green/70 mb-3">Add at least one language and proficiency level. You can add more if you like.</p>
              {rows.map((row, index) => (
                <div key={index} className="flex flex-wrap items-end gap-3 p-3 rounded-lg bg-off-white/80 border border-light-green/40">
                  <div className="flex-1 min-w-[140px]">
                    <label className="mb-1 block text-xs font-medium text-pastel-black">Language</label>
                    <select
                      value={row.language}
                      onChange={(e) => {
                        const next = [...rows];
                        next[index] = { ...next[index]!, language: e.target.value, otherLanguage: e.target.value === 'Other' ? (next[index]?.otherLanguage ?? '') : undefined };
                        update('languageSkills', serializeLanguageSkills(next));
                      }}
                      className="w-full rounded-lg border border-light-green/60 bg-white px-3 py-2.5 text-pastel-black"
                    >
                      <option value="">Select language</option>
                      {LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                  {row.language === 'Other' && (
                    <div className="flex-1 min-w-[140px]">
                      <label className="mb-1 block text-xs font-medium text-pastel-black">Specify language</label>
                      <input
                        type="text"
                        value={row.otherLanguage ?? ''}
                        onChange={(e) => {
                          const next = [...rows];
                          next[index] = { ...next[index]!, otherLanguage: e.target.value };
                          update('languageSkills', serializeLanguageSkills(next));
                        }}
                        placeholder="e.g. Bengali, Swahili"
                        className="w-full rounded-lg border border-light-green/60 bg-white px-3 py-2.5 text-pastel-black placeholder:text-dark-green/50"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-[140px]">
                    <label className="mb-1 block text-xs font-medium text-pastel-black">Proficiency</label>
                    <select
                      value={row.level}
                      onChange={(e) => {
                        const next = [...rows];
                        next[index] = { ...next[index]!, level: e.target.value };
                        update('languageSkills', serializeLanguageSkills(next));
                      }}
                      className="w-full rounded-lg border border-light-green/60 bg-white px-3 py-2.5 text-pastel-black"
                    >
                      <option value="">Select level</option>
                      {LANGUAGE_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = rows.filter((_, i) => i !== index);
                        update('languageSkills', serializeLanguageSkills(next.length ? next : [{ language: '', level: '' }]));
                      }}
                      className="py-2.5 px-3 text-sm text-red-600 hover:text-red-700 hover:bg-light-pink/30 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                onClick={() => update('languageSkills', serializeLanguageSkills([...rows, { language: '', level: '' }]))}
              >
                Add another language
              </Button>
            </div>
          );
        })()}

        {/* 5. Location Preferences */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-dark-green mb-4">Location Preferences</h2>
            <Input label="Which cities or places?" value={typeof data.locationPreferences === 'string' ? data.locationPreferences : (Array.isArray(data.locationPreferences) ? '' : '')} onChange={(e) => update('locationPreferences', e.target.value)} placeholder="Cities or places you prefer" />
          </div>
        )}

        {/* 6. Schedule & Availability */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-dark-green mb-4">Schedule & Availability</h2>
            <Input label="Start date – earliest date you are available to start?" type="date" value={data.availableStartDate ?? ''} onChange={(e) => update('availableStartDate', e.target.value)} />
            <Input label="Finish date" type="date" value={data.finishDate ?? ''} onChange={(e) => update('finishDate', e.target.value)} />
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={!!data.finishDateOngoing} onChange={(e) => update('finishDateOngoing', e.target.checked)} />
              No end date (ongoing)
            </label>
            {(data.nannyType ?? 'Nanny') === 'Au Pair' && (
              <label className="flex items-start gap-2 text-sm text-dark-green mt-4 p-3 rounded-lg bg-light-green/20 border border-light-green/50">
                <input type="checkbox" checked={!!data.euAuPairHoursAcknowledged} onChange={(e) => update('euAuPairHoursAcknowledged', e.target.checked)} className="mt-0.5" />
                <span>I understand that under EU Au Pair regulations, au pairs may work up to 30 hours per week. Hours are usually in the afternoons but may vary depending on the family&apos;s needs.</span>
              </label>
            )}
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">Available Hours</label>
              <div className="flex flex-wrap gap-3">
                {AVAILABLE_HOURS_OPTIONS.map((h) => (
                  <label key={h} className="flex items-center gap-2 text-sm text-dark-green">
                    <input type="checkbox" checked={(data.availableHours ?? []).includes(h)} onChange={(e) => update('availableHours', e.target.checked ? [...(data.availableHours ?? []), h] : (data.availableHours ?? []).filter((x) => x !== h))} />
                    {h}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">Available Weekends?</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="weekends" checked={data.availableWeekends === true} onChange={() => update('availableWeekends', true)} /> Yes</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="weekends" checked={data.availableWeekends === false} onChange={() => update('availableWeekends', false)} /> No</label>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">Available Days?</label>
              <div className="flex flex-wrap gap-3">
                {AVAILABLE_DAYS.map((d) => (
                  <label key={d} className="flex items-center gap-2 text-sm text-dark-green">
                    <input type="checkbox" checked={(data.availableDays ?? []).includes(d)} onChange={(e) => update('availableDays', e.target.checked ? [...(data.availableDays ?? []), d] : (data.availableDays ?? []).filter((x) => x !== d))} />
                    {d.slice(0, 3)}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 7. Experience */}
        {step === 6 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-dark-green mb-4">Experience</h2>
            <Input label="Years of Childcare Experience" type="number" min={0} value={data.yearsChildcareExperience ?? ''} onChange={(e) => update('yearsChildcareExperience', e.target.value ? Number(e.target.value) : undefined)} placeholder="0" />
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">Age Group Worked With</label>
              <div className="flex flex-wrap gap-3">
                {AGE_GROUPS.map((a) => (
                  <label key={a} className="flex items-center gap-2 text-sm text-dark-green">
                    <input type="checkbox" checked={(data.ageGroupsWorkedWith ?? []).includes(a)} onChange={(e) => update('ageGroupsWorkedWith', e.target.checked ? [...(data.ageGroupsWorkedWith ?? []), a] : (data.ageGroupsWorkedWith ?? []).filter((x) => x !== a))} />
                    {a}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">Special Needs Experiences (With Children – Please Elaborate)</label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="specialNeeds" checked={data.specialNeedsExperience === true} onChange={() => update('specialNeedsExperience', true)} /> Yes</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="specialNeeds" checked={data.specialNeedsExperience === false} onChange={() => update('specialNeedsExperience', false)} /> No</label>
              </div>
              <Input value={data.specialNeedsDetails ?? ''} onChange={(e) => update('specialNeedsDetails', e.target.value)} placeholder="Please elaborate if yes" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pastel-black">Maximum number of children comfortable with</label>
              <select value={data.maxChildrenComfortable ?? ''} onChange={(e) => update('maxChildrenComfortable', e.target.value ? Number(e.target.value) : undefined)} className="w-full rounded-lg border border-light-green/60 bg-off-white px-3 py-2.5 text-pastel-black">
                <option value="">Select</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* 8. Skills And Responsibilities */}
        {step === 7 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-dark-green mb-4">Skills And Responsibilities</h2>
            {(['canCook', 'tutoringHomework', 'lightHousekeeping', 'okToTravelAndSupport'] as const).map((key, i) => (
              <label key={key} className="flex items-center gap-2 text-sm text-dark-green">
                <input type="checkbox" checked={!!data[key]} onChange={(e) => update(key, e.target.checked)} />
                {['I can cook', 'I can help with tutoring / homework', 'I can help with light housekeeping', 'I am ok to travel and support'][i]}
              </label>
            ))}
          </div>
        )}

        {/* 9. Lifestyle And Values */}
        {step === 8 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-dark-green mb-4">Lifestyle And Values</h2>
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">Are you comfortable with pets?</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="pets" checked={data.comfortableWithPets === true} onChange={() => update('comfortableWithPets', true)} /> Yes</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="pets" checked={data.comfortableWithPets === false} onChange={() => update('comfortableWithPets', false)} /> No</label>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">Do you smoke?</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="smokeLifestyle" checked={data.smokes === true} onChange={() => update('smokes', true)} /> Yes</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="smokeLifestyle" checked={data.smokes === false} onChange={() => update('smokes', false)} /> No</label>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">Do you have strong religious beliefs?</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="religious" checked={data.strongReligiousBeliefs === true} onChange={() => update('strongReligiousBeliefs', true)} /> Yes</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="religious" checked={data.strongReligiousBeliefs === false} onChange={() => update('strongReligiousBeliefs', false)} /> No</label>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">Which Parenting style do you prefer to support?</label>
              <div className="flex flex-wrap gap-4">
                {PARENTING_STYLES.map((p) => (
                  <label key={p} className="flex items-center gap-2 text-sm"><input type="radio" name="parenting" value={p} checked={data.parentingStylePreference === p} onChange={() => update('parentingStylePreference', p)} /> {p}</label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 10. Dietary Requirements */}
        {step === 9 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-dark-green mb-4">Dietary Requirements</h2>
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">Do you have dietary restrictions?</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="dietRestrict" checked={data.dietaryRestrictions === true} onChange={() => update('dietaryRestrictions', true)} /> Yes</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="dietRestrict" checked={data.dietaryRestrictions === false} onChange={() => update('dietaryRestrictions', false)} /> No</label>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">Are you willing to cook non-vegetarian meals?</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="cookNonVeg" checked={data.willingToCookNonVegetarian === true} onChange={() => update('willingToCookNonVegetarian', true)} /> Yes</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="cookNonVeg" checked={data.willingToCookNonVegetarian === false} onChange={() => update('willingToCookNonVegetarian', false)} /> No</label>
              </div>
            </div>
            <Input label="Please specify your diet" value={data.dietaryDetails ?? ''} onChange={(e) => update('dietaryDetails', e.target.value)} placeholder="Vegan, Gluten free, etc" />
          </div>
        )}

        {/* 11. Compensation And Agreement */}
        {step === 10 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-dark-green mb-4">Compensation And Agreement</h2>
            {(data.nannyType ?? 'Nanny') === 'Au Pair' ? (
              <>
                <Input label="Expected weekly pocket money" value={String(data.expectedWeeklyPocketMoney ?? '')} onChange={(e) => update('expectedWeeklyPocketMoney', e.target.value || undefined)} placeholder="e.g. 100" />
                <div>
                  <label className="mb-2 block text-sm font-medium text-pastel-black">Preferred days off</label>
                  <div className="flex flex-wrap gap-3">
                    {AVAILABLE_DAYS.map((d) => (
                      <label key={d} className="flex items-center gap-2 text-sm text-dark-green">
                        <input type="checkbox" checked={(data.preferredDaysOff ?? []).includes(d)} onChange={(e) => update('preferredDaysOff', e.target.checked ? [...(data.preferredDaysOff ?? []), d] : (data.preferredDaysOff ?? []).filter((x) => x !== d))} />
                        {d}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <Input label="Expected Monthly Salary (Net)" value={String(data.expectedMonthlySalaryNet ?? '')} onChange={(e) => update('expectedMonthlySalaryNet', e.target.value || undefined)} placeholder="e.g. 2000" />
                <div>
                  <label className="mb-2 block text-sm font-medium text-pastel-black">Preferred contract type</label>
                  <div className="flex flex-wrap gap-4">
                    {CONTRACT_TYPES.map((c) => (
                      <label key={c} className="flex items-center gap-2 text-sm"><input type="radio" name="contract" value={c} checked={data.preferredContractType === c} onChange={() => update('preferredContractType', c)} /> {c}</label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-pastel-black">Preferred days off</label>
                  <div className="flex flex-wrap gap-3">
                    {AVAILABLE_DAYS.map((d) => (
                      <label key={d} className="flex items-center gap-2 text-sm text-dark-green">
                        <input type="checkbox" checked={(data.preferredDaysOff ?? []).includes(d)} onChange={(e) => update('preferredDaysOff', e.target.checked ? [...(data.preferredDaysOff ?? []), d] : (data.preferredDaysOff ?? []).filter((x) => x !== d))} />
                        {d.slice(0, 3)}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 12. Write a few words about you */}
        {step === 11 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-dark-green mb-4">Write a few words about you</h2>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pastel-black">About you</label>
              <textarea
                value={data.aboutMe ?? ''}
                onChange={(e) => update('aboutMe', e.target.value)}
                placeholder="Let families know more about you and what their daily life will be like."
                rows={5}
                className="w-full rounded-lg border border-light-green/60 bg-off-white px-3 py-2.5 text-pastel-black placeholder:text-dark-green/50 focus:border-dark-green focus:outline-none"
              />
            </div>
          </div>
        )}
      </Card>

      {savedSegment === currentSegment.id && (
        <p className="mb-4 text-sm text-dark-green font-medium">Section saved. You can continue or come back later.</p>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-light-pink/50 text-dark-green text-sm">{error}</div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button type="button" variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          Back
        </Button>
        <div className="flex gap-3">
          <Button type="button" variant="primary" onClick={saveSegment} disabled={loading}>
            {loading ? 'Saving…' : 'Save this section'}
          </Button>
          {step < NANNY_ONBOARDING_SEGMENTS.length - 1 ? (
            <Button type="button" variant="primary" onClick={() => setStep((s) => s + 1)}>
              Next
            </Button>
          ) : (
            <Button type="button" variant="primary" onClick={goToDashboard}>
              Go to dashboard
            </Button>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-dark-green/80">
        By saving, you agree to our Terms and Conditions and that your data will be used for matching.
      </p>
      <p className="mt-2 text-center text-sm text-dark-green/80">
        <Link href="/nanny/dashboard" className="text-dark-green font-medium hover:underline">
          Skip for now — go to dashboard
        </Link>
      </p>
    </div>
  );
}
