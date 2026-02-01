'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Card } from '@/components/ui';
import type { NannyOnboardingInput } from '@/lib/validation/nanny-onboarding';

const STEPS = [
  { title: 'Profile & contact', id: 'profile' },
  { title: 'About & location', id: 'about' },
  { title: 'Schedule & experience', id: 'schedule' },
  { title: 'Lifestyle & about', id: 'lifestyle' },
];

const defaultData: NannyOnboardingInput = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  streetAndNumber: '',
  postcode: '',
  city: '',
  country: '',
  phone: '',
  currentLocation: '',
  nationality: '',
  availableStartDate: '',
  finishDate: '',
  aboutMe: '',
};

export default function NannyOnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<NannyOnboardingInput>(defaultData);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

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
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/nanny/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Something went wrong.');
        setLoading(false);
        return;
      }
      router.push('/nanny/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  if (status === 'loading' || fetching) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <p className="text-dark-green/80">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        Nanny profile
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">
        Step {step + 1} of {STEPS.length}: {STEPS[step].title}
      </p>

      <div className="mb-4 flex gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(i)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              i === step
                ? 'bg-dark-green text-off-white'
                : 'bg-light-green/50 text-dark-green hover:bg-light-green'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <Card className="p-6 mb-6">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-medium text-pastel-black mb-4">Profile & contact</h2>
            <Input label="First name" value={data.firstName ?? ''} onChange={(e) => update('firstName', e.target.value)} placeholder="First name" />
            <Input label="Last name" value={data.lastName ?? ''} onChange={(e) => update('lastName', e.target.value)} placeholder="Last name" />
            <Input label="Date of birth" type="date" value={data.dateOfBirth ?? ''} onChange={(e) => update('dateOfBirth', e.target.value)} />
            <Input label="Gender" value={data.gender ?? ''} onChange={(e) => update('gender', e.target.value)} placeholder="Gender" />
            <Input label="Street and number" value={data.streetAndNumber ?? ''} onChange={(e) => update('streetAndNumber', e.target.value)} placeholder="Street and house number" />
            <Input label="Postcode" value={data.postcode ?? ''} onChange={(e) => update('postcode', e.target.value)} />
            <Input label="City" value={data.city ?? ''} onChange={(e) => update('city', e.target.value)} />
            <Input label="Country" value={data.country ?? ''} onChange={(e) => update('country', e.target.value)} />
            <Input label="Phone" type="tel" value={data.phone ?? ''} onChange={(e) => update('phone', e.target.value)} />
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-medium text-pastel-black mb-4">About you</h2>
            <Input label="Where do you currently live" value={data.currentLocation ?? ''} onChange={(e) => update('currentLocation', e.target.value)} placeholder="City / country" />
            <Input label="Nationality" value={data.nationality ?? ''} onChange={(e) => update('nationality', e.target.value)} />
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={data.hasChildcareExperience ?? false} onChange={(e) => update('hasChildcareExperience', e.target.checked)} />
              I have childcare experience
            </label>
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={data.hasDrivingLicence ?? false} onChange={(e) => update('hasDrivingLicence', e.target.checked)} />
              I have a valid driving licence
            </label>
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={data.vegetarianOrVegan ?? false} onChange={(e) => update('vegetarianOrVegan', e.target.checked)} />
              I am vegetarian or vegan
            </label>
            <Input label="Location preferences (e.g. country, cities)" value={typeof data.locationPreferences === 'string' ? data.locationPreferences : ''} onChange={(e) => update('locationPreferences', e.target.value)} placeholder="Countries or cities you prefer" />
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-medium text-pastel-black mb-4">Schedule & experience</h2>
            <Input label="Available start date" type="date" value={data.availableStartDate ?? ''} onChange={(e) => update('availableStartDate', e.target.value)} />
            <Input label="Finish date" type="date" value={data.finishDate ?? ''} onChange={(e) => update('finishDate', e.target.value)} />
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={data.finishDateOngoing ?? false} onChange={(e) => update('finishDateOngoing', e.target.checked)} />
              Ongoing
            </label>
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={data.availableWeekends ?? false} onChange={(e) => update('availableWeekends', e.target.checked)} />
              Available weekends
            </label>
            <Input label="Years of childcare experience" type="number" min={0} value={data.yearsChildcareExperience ?? ''} onChange={(e) => update('yearsChildcareExperience', e.target.value ? Number(e.target.value) : undefined)} placeholder="0" />
            <Input label="Age groups worked with (comma-separated)" value={Array.isArray(data.ageGroupsWorkedWith) ? data.ageGroupsWorkedWith.join(', ') : (data.ageGroupsWorkedWith ?? '')} onChange={(e) => update('ageGroupsWorkedWith', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} placeholder="0-2, 3-6, 7-12, Teens" />
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={data.specialNeedsExperience ?? false} onChange={(e) => update('specialNeedsExperience', e.target.checked)} />
              Special needs experience
            </label>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pastel-black">Max children comfortable with</label>
              <select
                value={data.maxChildrenComfortable ?? ''}
                onChange={(e) => update('maxChildrenComfortable', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full rounded-lg border border-light-green/60 bg-off-white px-3 py-2.5 text-pastel-black"
              >
                <option value="">Select</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={data.canCook ?? false} onChange={(e) => update('canCook', e.target.checked)} />
              I can cook
            </label>
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={data.tutoringHomework ?? false} onChange={(e) => update('tutoringHomework', e.target.checked)} />
              Tutoring / homework
            </label>
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={data.lightHousekeeping ?? false} onChange={(e) => update('lightHousekeeping', e.target.checked)} />
              Light housekeeping
            </label>
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={data.okToTravelAndSupport ?? false} onChange={(e) => update('okToTravelAndSupport', e.target.checked)} />
              I am ok to travel and support
            </label>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-medium text-pastel-black mb-4">Lifestyle & about</h2>
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={data.comfortableWithPets ?? false} onChange={(e) => update('comfortableWithPets', e.target.checked)} />
              Comfortable with pets
            </label>
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={data.smokes ?? false} onChange={(e) => update('smokes', e.target.checked)} />
              I smoke
            </label>
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={data.strongReligiousBeliefs ?? false} onChange={(e) => update('strongReligiousBeliefs', e.target.checked)} />
              Strong religious beliefs
            </label>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pastel-black">Parenting style preference</label>
              <select
                value={data.parentingStylePreference ?? ''}
                onChange={(e) => update('parentingStylePreference', e.target.value as NannyOnboardingInput['parentingStylePreference'])}
                className="w-full rounded-lg border border-light-green/60 bg-off-white px-3 py-2.5 text-pastel-black"
              >
                <option value="">Select</option>
                <option value="Gentle">Gentle</option>
                <option value="Balanced">Balanced</option>
                <option value="Structured">Structured</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={data.dietaryRestrictions ?? false} onChange={(e) => update('dietaryRestrictions', e.target.checked)} />
              I have dietary restrictions
            </label>
            <Input label="Dietary details" value={data.dietaryDetails ?? ''} onChange={(e) => update('dietaryDetails', e.target.value)} placeholder="Vegan, gluten free, etc." />
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={data.willingToCookNonVegetarian ?? false} onChange={(e) => update('willingToCookNonVegetarian', e.target.checked)} />
              Willing to cook non-vegetarian meals
            </label>
            <Input label="Expected monthly salary (net)" value={String(data.expectedMonthlySalaryNet ?? '')} onChange={(e) => update('expectedMonthlySalaryNet', e.target.value || undefined)} placeholder="Numbers only" />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pastel-black">Preferred contract type</label>
              <select
                value={data.preferredContractType ?? ''}
                onChange={(e) => update('preferredContractType', e.target.value as NannyOnboardingInput['preferredContractType'])}
                className="w-full rounded-lg border border-light-green/60 bg-off-white px-3 py-2.5 text-pastel-black"
              >
                <option value="">Select</option>
                <option value="Part time">Part time</option>
                <option value="Full time">Full time</option>
                <option value="Seasonal">Seasonal</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pastel-black">About you</label>
              <textarea
                value={data.aboutMe ?? ''}
                onChange={(e) => update('aboutMe', e.target.value)}
                placeholder="A few words about you, hobbies, free time..."
                rows={4}
                className="w-full rounded-lg border border-light-green/60 bg-off-white px-3 py-2.5 text-pastel-black placeholder:text-dark-green/50 focus:border-dark-green focus:outline-none"
              />
            </div>
          </div>
        )}
      </Card>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-light-pink/50 text-dark-green text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-between">
        <Button
          type="button"
          variant="secondary"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" variant="primary" onClick={() => setStep((s) => s + 1)}>
            Next
          </Button>
        ) : (
          <Button type="button" variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving…' : 'Save and continue'}
          </Button>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-dark-green/80">
        <Link href="/nanny/dashboard" className="text-dark-green font-medium hover:underline">
          Skip for now — go to dashboard
        </Link>
      </p>
    </div>
  );
}
