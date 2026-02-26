'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Card } from '@/components/ui';
import {
  HOST_ONBOARDING_SEGMENTS,
  type HostOnboardingInput,
  type HostOnboardingSegmentId,
} from '@/lib/validation/host-onboarding';
import { compressImage, MAX_PROFILE_IMAGE_BYTES, isImageFile, isHeicFile, convertHeicToJpeg } from '@/lib/image-compress';

const REQUIRED_HOURS_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Overnight'] as const;
const REQUIRED_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const AGE_GROUPS = ['Infant', 'Toddler', 'School age', 'Teen'] as const;
const LANGUAGE_LEVELS = ['Mother tongue', 'Conversational', 'Basic'] as const;
const DIETARY_OPTIONS = ['Vegan', 'Vegetarian', 'Halal/Kosher', 'No pork', 'No dairy', 'Gluten free'] as const;

const defaultData: HostOnboardingInput = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  profileImageUrl: '',
  streetAndNumber: '',
  postcode: '',
  city: '',
  country: '',
  phone: '',
  jobLocationCountry: '',
  jobLocationPlace: '',
  accommodationType: undefined,
  householdLanguages: '',
  travelExpectations: undefined,
  childrenAndAges: '',
  desiredStartDate: '',
  finishDate: '',
  finishDateOngoing: false,
  requiredHours: [],
  weekendsRequired: false,
  requiredDays: [],
  ageGroupExperienceRequired: [],
  specialNeedsCare: false,
  maxChildren: undefined,
  cookingForChildren: false,
  tutoringHomework: false,
  driving: false,
  travelAssistance: false,
  lightHousekeeping: false,
  primaryLanguageRequired: '',
  primaryLanguageLevel: undefined,
  languageSpokenWithChildren: '',
  languageSpokenWithChildrenLevel: undefined,
  petsInHome: false,
  smokingPolicy: undefined,
  strongReligiousBeliefs: false,
  parentingStyle: undefined,
  dietaryPreferences: [],
  nannyFollowDietary: false,
  monthlySalaryRange: undefined,
  preferredContractType: undefined,
  trialPeriodPreference: undefined,
  aboutFamily: '',
};

function getSegmentPayload(segmentId: HostOnboardingSegmentId, data: HostOnboardingInput): Record<string, unknown> {
  const segment = HOST_ONBOARDING_SEGMENTS.find((s) => s.id === segmentId);
  if (!segment) return {};
  const out: Record<string, unknown> = { segment: segmentId };
  for (const k of segment.keys) {
    const v = data[k as keyof HostOnboardingInput];
    if (v === undefined) continue;
    if (typeof v === 'boolean' || Array.isArray(v)) {
      out[k] = v;
      continue;
    }
    if (v !== '') out[k] = v;
  }
  return out;
}

export default function HostOnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<HostOnboardingInput>(defaultData);
  const [loading, setLoading] = useState(false);
  const [savedSegment, setSavedSegment] = useState<HostOnboardingSegmentId | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/host/onboarding');
      return;
    }
    if (status !== 'authenticated') return;
    fetch('/api/host/onboarding')
      .then((r) => r.json())
      .then((res) => {
        if (res.host && typeof res.host === 'object') {
          setData((prev) => ({ ...defaultData, ...prev, ...res.host }));
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [status, router]);

  const update = (key: keyof HostOnboardingInput, value: unknown) => {
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
    const segmentId = HOST_ONBOARDING_SEGMENTS[step]!.id;
    setLoading(true);
    setError('');
    try {
      const payload = getSegmentPayload(segmentId, data);
      const res = await fetch('/api/host/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Something went wrong.');
        setLoading(false);
        return;
      }
      setSavedSegment(segmentId);
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const goToDashboard = () => router.push('/host/dashboard');

  if (status === 'loading' || fetching) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <p className="text-dark-green/80">Loading…</p>
      </div>
    );
  }

  const currentSegment = HOST_ONBOARDING_SEGMENTS[step]!;
  const isLastStep = step === HOST_ONBOARDING_SEGMENTS.length - 1;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        Host Information
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">
        Step {step + 1} of {HOST_ONBOARDING_SEGMENTS.length}: {currentSegment.title}
      </p>

      <div className="mb-4 flex gap-1 flex-wrap">
        {HOST_ONBOARDING_SEGMENTS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(i)}
            className={`rounded-lg py-2 px-2 min-w-[2rem] text-sm font-medium transition-colors ${
              i === step ? 'bg-dark-green text-off-white' : 'bg-light-green/50 text-dark-green hover:bg-light-green'
            }`}
            title={s.title}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <Card className="p-6 mb-6 bg-off-white border-2 border-light-green/40">
        {/* 1. Profile Info */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-dark-green mb-4">Profile Info</h2>
            <Input label="First Name" value={data.firstName ?? ''} onChange={(e) => update('firstName', e.target.value)} placeholder="First name" />
            <Input label="Last Name" value={data.lastName ?? ''} onChange={(e) => update('lastName', e.target.value)} placeholder="Last name" />
            <Input label="Date of birth" type="date" value={data.dateOfBirth ?? ''} onChange={(e) => update('dateOfBirth', e.target.value)} />
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
          </div>
        )}

        {/* 2. Contact Details */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-dark-green mb-4">Contact Details</h2>
            <Input label="Street and house number" value={data.streetAndNumber ?? ''} onChange={(e) => update('streetAndNumber', e.target.value)} placeholder="Street and number" />
            <Input label="Postal Code" value={data.postcode ?? ''} onChange={(e) => update('postcode', e.target.value)} placeholder="Postcode" />
            <Input label="City" value={data.city ?? ''} onChange={(e) => update('city', e.target.value)} placeholder="City" />
            <Input label="Country" value={data.country ?? ''} onChange={(e) => update('country', e.target.value)} placeholder="Country" />
            <Input label="Phone *" type="tel" value={data.phone ?? ''} onChange={(e) => update('phone', e.target.value)} placeholder="Phone" required />
          </div>
        )}

        {/* 3. Location and living setup */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-dark-green mb-4">Location and living setup</h2>
            <Input label="Job Location" value={data.jobLocationPlace ?? ''} onChange={(e) => update('jobLocationPlace', e.target.value)} placeholder="City or area" />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pastel-black">Accommodation type</label>
              <select value={data.accommodationType ?? ''} onChange={(e) => update('accommodationType', e.target.value || undefined)} className="w-full rounded-lg border border-light-green/60 bg-off-white px-3 py-2.5 text-pastel-black">
                <option value="">Select</option>
                <option value="Live-In">Live-In</option>
                <option value="Live-Out">Live-Out</option>
                <option value="Either">Either</option>
              </select>
            </div>
            <Input label="Household Languages" value={typeof data.householdLanguages === 'string' ? data.householdLanguages : (Array.isArray(data.householdLanguages) ? data.householdLanguages.join(', ') : '')} onChange={(e) => update('householdLanguages', e.target.value)} placeholder="e.g. English, Spanish" />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pastel-black">Travel Expectations</label>
              <select value={data.travelExpectations ?? ''} onChange={(e) => update('travelExpectations', e.target.value || undefined)} className="w-full rounded-lg border border-light-green/60 bg-off-white px-3 py-2.5 text-pastel-black">
                <option value="">Select</option>
                <option value="None">None</option>
                <option value="Occasional">Occasional</option>
                <option value="Frequent Travel with Family">Frequent Travel with Family</option>
              </select>
            </div>
            <Input label="Children and ages" value={data.childrenAndAges ?? ''} onChange={(e) => update('childrenAndAges', e.target.value)} placeholder="e.g. 2 and 5" />
          </div>
        )}

        {/* 4. Schedule & Required Days */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-dark-green mb-4">Schedule & Required Days</h2>
            <Input label="Desired start date" type="date" value={data.desiredStartDate ?? ''} onChange={(e) => update('desiredStartDate', e.target.value)} />
            <Input label="Finish date" type="date" value={data.finishDate ?? ''} onChange={(e) => update('finishDate', e.target.value)} />
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={data.finishDateOngoing ?? false} onChange={(e) => update('finishDateOngoing', e.target.checked)} />
              No end date (ongoing)
            </label>
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">Required hours (select up to 2)</label>
              <div className="flex flex-wrap gap-3">
                {REQUIRED_HOURS_OPTIONS.map((h) => (
                  <label key={h} className="flex items-center gap-2 text-sm text-dark-green">
                    <input
                      type="checkbox"
                      checked={(data.requiredHours ?? []).includes(h)}
                      onChange={(e) => {
                        const prev = data.requiredHours ?? [];
                        const next = e.target.checked ? [...prev, h].slice(-2) : prev.filter((x) => x !== h);
                        update('requiredHours', next);
                      }}
                    />
                    {h}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">Weekends required?</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="weekends" checked={data.weekendsRequired === true} onChange={() => update('weekendsRequired', true)} /> Yes</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="weekends" checked={data.weekendsRequired === false} onChange={() => update('weekendsRequired', false)} /> No</label>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">Days required?</label>
              <div className="flex flex-wrap gap-3">
                {REQUIRED_DAYS.map((d) => (
                  <label key={d} className="flex items-center gap-2 text-sm text-dark-green">
                    <input type="checkbox" checked={(data.requiredDays ?? []).includes(d)} onChange={(e) => update('requiredDays', e.target.checked ? [...(data.requiredDays ?? []), d] : (data.requiredDays ?? []).filter((x) => x !== d))} />
                    {d.slice(0, 3)}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. Childcare needs */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-dark-green mb-4">Childcare needs</h2>
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">Age group experience required</label>
              <div className="flex flex-wrap gap-3">
                {AGE_GROUPS.map((a) => (
                  <label key={a} className="flex items-center gap-2 text-sm text-dark-green">
                    <input type="checkbox" checked={(data.ageGroupExperienceRequired ?? []).includes(a)} onChange={(e) => update('ageGroupExperienceRequired', e.target.checked ? [...(data.ageGroupExperienceRequired ?? []), a] : (data.ageGroupExperienceRequired ?? []).filter((x) => x !== a))} />
                    {a}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">Special needs care</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="specialNeeds" checked={data.specialNeedsCare === true} onChange={() => update('specialNeedsCare', true)} /> Yes</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="specialNeeds" checked={data.specialNeedsCare === false} onChange={() => update('specialNeedsCare', false)} /> No</label>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pastel-black">Maximum number of children nanny will care for</label>
              <div className="flex gap-4 flex-wrap">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className="flex items-center gap-2 text-sm"><input type="radio" name="maxChildren" checked={data.maxChildren === n} onChange={() => update('maxChildren', n)} /> {n}</label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 6. Skills and responsibilities */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-dark-green mb-4">Skills and responsibilities</h2>
            {(['cookingForChildren', 'tutoringHomework', 'driving', 'travelAssistance', 'lightHousekeeping'] as const).map((key, i) => (
              <label key={key} className="flex items-center gap-2 text-sm text-dark-green">
                <input type="checkbox" checked={!!data[key]} onChange={(e) => update(key, e.target.checked)} />
                {['Cooking for children', 'Tutoring / Homework Support', 'Driving', 'Travel Assistance', 'Light Housekeeping'][i]}
              </label>
            ))}
          </div>
        )}

        {/* 7. Language skills */}
        {step === 6 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-dark-green mb-4">Language skills</h2>
            <Input label="Primary Language Required" value={data.primaryLanguageRequired ?? ''} onChange={(e) => update('primaryLanguageRequired', e.target.value)} placeholder="e.g. English" />
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">Primary Language Level</label>
              <div className="flex flex-wrap gap-4">
                {LANGUAGE_LEVELS.map((l) => (
                  <label key={l} className="flex items-center gap-2 text-sm"><input type="radio" name="primaryLevel" checked={data.primaryLanguageLevel === l} onChange={() => update('primaryLanguageLevel', l)} /> {l}</label>
                ))}
              </div>
            </div>
            <Input label="Language to be spoken with children" value={data.languageSpokenWithChildren ?? ''} onChange={(e) => update('languageSpokenWithChildren', e.target.value)} placeholder="e.g. English" />
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">Language level with children</label>
              <div className="flex flex-wrap gap-4">
                {LANGUAGE_LEVELS.map((l) => (
                  <label key={l} className="flex items-center gap-2 text-sm"><input type="radio" name="childrenLevel" checked={data.languageSpokenWithChildrenLevel === l} onChange={() => update('languageSpokenWithChildrenLevel', l)} /> {l}</label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 8. Lifestyle and household */}
        {step === 7 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-dark-green mb-4">Lifestyle and household</h2>
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">Do you have pets living inside of home?</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="pets" checked={data.petsInHome === true} onChange={() => update('petsInHome', true)} /> Yes</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="pets" checked={data.petsInHome === false} onChange={() => update('petsInHome', false)} /> No</label>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">Smoking Policy</label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="smoking" value="No smoking" checked={data.smokingPolicy === 'No smoking'} onChange={(e) => update('smokingPolicy', e.target.value as 'No smoking')} /> No smoking</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="smoking" value="Outdoor only" checked={data.smokingPolicy === 'Outdoor only'} onChange={(e) => update('smokingPolicy', e.target.value as 'Outdoor only')} /> Outdoor only</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="smoking" value="Flexible" checked={data.smokingPolicy === 'Flexible'} onChange={(e) => update('smokingPolicy', e.target.value as 'Flexible')} /> Flexible</label>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">Do you have strong religious belief?</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="religious" checked={data.strongReligiousBeliefs === true} onChange={() => update('strongReligiousBeliefs', true)} /> Yes</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="religious" checked={data.strongReligiousBeliefs === false} onChange={() => update('strongReligiousBeliefs', false)} /> No</label>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">Parenting style</label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="parenting" value="Gentle" checked={data.parentingStyle === 'Gentle'} onChange={(e) => update('parentingStyle', e.target.value as 'Gentle')} /> Gentle</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="parenting" value="Balanced" checked={data.parentingStyle === 'Balanced'} onChange={(e) => update('parentingStyle', e.target.value as 'Balanced')} /> Balanced</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="parenting" value="Structured" checked={data.parentingStyle === 'Structured'} onChange={(e) => update('parentingStyle', e.target.value as 'Structured')} /> Structured</label>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">Dietary Preferences</label>
              <div className="flex flex-wrap gap-3">
                {DIETARY_OPTIONS.map((d) => (
                  <label key={d} className="flex items-center gap-2 text-sm text-dark-green">
                    <input type="checkbox" checked={(data.dietaryPreferences ?? []).includes(d)} onChange={(e) => update('dietaryPreferences', e.target.checked ? [...(data.dietaryPreferences ?? []), d] : (data.dietaryPreferences ?? []).filter((x) => x !== d))} />
                    {d}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">Do you expect the nanny to follow this?</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="nannyDiet" checked={data.nannyFollowDietary === true} onChange={() => update('nannyFollowDietary', true)} /> Yes</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="nannyDiet" checked={data.nannyFollowDietary === false} onChange={() => update('nannyFollowDietary', false)} /> No</label>
              </div>
            </div>
          </div>
        )}

        {/* 9. Compensation and contract */}
        {step === 8 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-dark-green mb-4">Compensation and contract</h2>
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">Monthly salary</label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="salary" value="€1000-€2000" checked={data.monthlySalaryRange === '€1000-€2000'} onChange={(e) => update('monthlySalaryRange', e.target.value as HostOnboardingInput['monthlySalaryRange'])} /> €1000–€2000</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="salary" value="€2000-€4000" checked={data.monthlySalaryRange === '€2000-€4000'} onChange={(e) => update('monthlySalaryRange', e.target.value as HostOnboardingInput['monthlySalaryRange'])} /> €2000–€4000</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="salary" value="€4000+" checked={data.monthlySalaryRange === '€4000+'} onChange={(e) => update('monthlySalaryRange', e.target.value as HostOnboardingInput['monthlySalaryRange'])} /> €4000+</label>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">Preferred Contract type</label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="contract" value="Part time" checked={data.preferredContractType === 'Part time'} onChange={(e) => update('preferredContractType', e.target.value as 'Part time')} /> Part time</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="contract" value="Full time" checked={data.preferredContractType === 'Full time'} onChange={(e) => update('preferredContractType', e.target.value as 'Full time')} /> Full time</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="contract" value="Seasonal" checked={data.preferredContractType === 'Seasonal'} onChange={(e) => update('preferredContractType', e.target.value as 'Seasonal')} /> Seasonal</label>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-pastel-black">Trial Period preference</label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="trial" value="2 weeks" checked={data.trialPeriodPreference === '2 weeks'} onChange={(e) => update('trialPeriodPreference', e.target.value as '2 weeks')} /> 2 weeks</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="trial" value="1 month" checked={data.trialPeriodPreference === '1 month'} onChange={(e) => update('trialPeriodPreference', e.target.value as '1 month')} /> 1 month</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="trial" value="No trial" checked={data.trialPeriodPreference === 'No trial'} onChange={(e) => update('trialPeriodPreference', e.target.value as 'No trial')} /> No trial</label>
              </div>
            </div>
          </div>
        )}

        {/* 10. Write a few words about you */}
        {step === 9 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-dark-green mb-4">Write a few words about you</h2>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pastel-black">About you and the family</label>
              <textarea
                value={data.aboutFamily ?? ''}
                onChange={(e) => update('aboutFamily', e.target.value)}
                placeholder="Let nannies know more about you and the family and what their daily life will be like."
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
          {step < HOST_ONBOARDING_SEGMENTS.length - 1 ? (
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
        <Link href="/host/dashboard" className="text-dark-green font-medium hover:underline">
          Skip for now — go to dashboard
        </Link>
      </p>
    </div>
  );
}
