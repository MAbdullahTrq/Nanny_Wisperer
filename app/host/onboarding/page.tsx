'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Card } from '@/components/ui';
import type { HostOnboardingInput } from '@/lib/validation/host-onboarding';

const STEPS = [
  { title: 'Profile & contact', id: 'profile' },
  { title: 'Location & schedule', id: 'location' },
  { title: 'Childcare & skills', id: 'childcare' },
  { title: 'Lifestyle & about', id: 'lifestyle' },
];

const defaultData: HostOnboardingInput = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  streetAndNumber: '',
  postcode: '',
  city: '',
  country: '',
  phone: '',
  jobLocationCountry: '',
  jobLocationPlace: '',
  childrenAndAges: '',
  desiredStartDate: '',
  finishDate: '',
  aboutFamily: '',
};

export default function HostOnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<HostOnboardingInput>(defaultData);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

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
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/host/onboarding', {
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
      router.push('/host/dashboard');
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
        Host family profile
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
            <Input label="Street and number" value={data.streetAndNumber ?? ''} onChange={(e) => update('streetAndNumber', e.target.value)} placeholder="Street and house number" />
            <Input label="Postcode" value={data.postcode ?? ''} onChange={(e) => update('postcode', e.target.value)} placeholder="Postcode" />
            <Input label="City" value={data.city ?? ''} onChange={(e) => update('city', e.target.value)} placeholder="City" />
            <Input label="Country" value={data.country ?? ''} onChange={(e) => update('country', e.target.value)} placeholder="Country" />
            <Input label="Phone" type="tel" value={data.phone ?? ''} onChange={(e) => update('phone', e.target.value)} placeholder="Phone" />
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-medium text-pastel-black mb-4">Location & schedule</h2>
            <Input label="Job location (country)" value={data.jobLocationCountry ?? ''} onChange={(e) => update('jobLocationCountry', e.target.value)} placeholder="Country" />
            <Input label="Place / city" value={data.jobLocationPlace ?? ''} onChange={(e) => update('jobLocationPlace', e.target.value)} placeholder="Place" />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pastel-black">Accommodation type</label>
              <select
                value={data.accommodationType ?? ''}
                onChange={(e) => update('accommodationType', e.target.value as HostOnboardingInput['accommodationType'])}
                className="w-full rounded-lg border border-light-green/60 bg-off-white px-3 py-2.5 text-pastel-black"
              >
                <option value="">Select</option>
                <option value="Live-In">Live-In</option>
                <option value="Live-Out">Live-Out</option>
                <option value="Either">Either</option>
              </select>
            </div>
            <Input label="Travel expectations" value={data.travelExpectations ?? ''} onChange={(e) => update('travelExpectations', e.target.value)} placeholder="None / Occasional / Frequent" />
            <Input label="Children and ages" value={data.childrenAndAges ?? ''} onChange={(e) => update('childrenAndAges', e.target.value)} placeholder="e.g. 2 and 5" />
            <Input label="Desired start date" type="date" value={data.desiredStartDate ?? ''} onChange={(e) => update('desiredStartDate', e.target.value)} />
            <Input label="Finish date" type="date" value={data.finishDate ?? ''} onChange={(e) => update('finishDate', e.target.value)} />
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={data.finishDateOngoing ?? false} onChange={(e) => update('finishDateOngoing', e.target.checked)} />
              Ongoing (no end date)
            </label>
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={data.weekendsRequired ?? false} onChange={(e) => update('weekendsRequired', e.target.checked)} />
              Weekends required
            </label>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-medium text-pastel-black mb-4">Childcare & skills</h2>
            <Input label="Age groups required (comma-separated)" value={Array.isArray(data.ageGroupExperienceRequired) ? data.ageGroupExperienceRequired.join(', ') : (data.ageGroupExperienceRequired ?? '')} onChange={(e) => update('ageGroupExperienceRequired', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} placeholder="Infant, Toddler, School age, Teen" />
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={data.specialNeedsCare ?? false} onChange={(e) => update('specialNeedsCare', e.target.checked)} />
              Special needs care required
            </label>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pastel-black">Max number of children</label>
              <select
                value={data.maxChildren ?? ''}
                onChange={(e) => update('maxChildren', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full rounded-lg border border-light-green/60 bg-off-white px-3 py-2.5 text-pastel-black"
              >
                <option value="">Select</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={data.cookingForChildren ?? false} onChange={(e) => update('cookingForChildren', e.target.checked)} />
              Cooking for children
            </label>
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={data.tutoringHomework ?? false} onChange={(e) => update('tutoringHomework', e.target.checked)} />
              Tutoring / homework support
            </label>
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={data.driving ?? false} onChange={(e) => update('driving', e.target.checked)} />
              Driving
            </label>
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={data.travelAssistance ?? false} onChange={(e) => update('travelAssistance', e.target.checked)} />
              Travel assistance
            </label>
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={data.lightHousekeeping ?? false} onChange={(e) => update('lightHousekeeping', e.target.checked)} />
              Light housekeeping
            </label>
            <Input label="Primary language required" value={data.primaryLanguageRequired ?? ''} onChange={(e) => update('primaryLanguageRequired', e.target.value)} placeholder="e.g. English" />
            <Input label="Language spoken with children" value={data.languageSpokenWithChildren ?? ''} onChange={(e) => update('languageSpokenWithChildren', e.target.value)} placeholder="e.g. English" />
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-medium text-pastel-black mb-4">Lifestyle & about</h2>
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={data.petsInHome ?? false} onChange={(e) => update('petsInHome', e.target.checked)} />
              Pets in home
            </label>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pastel-black">Smoking policy</label>
              <select
                value={data.smokingPolicy ?? ''}
                onChange={(e) => update('smokingPolicy', e.target.value as HostOnboardingInput['smokingPolicy'])}
                className="w-full rounded-lg border border-light-green/60 bg-off-white px-3 py-2.5 text-pastel-black"
              >
                <option value="">Select</option>
                <option value="No smoking">No smoking</option>
                <option value="Outdoor only">Outdoor only</option>
                <option value="Flexible">Flexible</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-dark-green">
              <input type="checkbox" checked={data.strongReligiousBeliefs ?? false} onChange={(e) => update('strongReligiousBeliefs', e.target.checked)} />
              Strong religious beliefs
            </label>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pastel-black">Parenting style</label>
              <select
                value={data.parentingStyle ?? ''}
                onChange={(e) => update('parentingStyle', e.target.value as HostOnboardingInput['parentingStyle'])}
                className="w-full rounded-lg border border-light-green/60 bg-off-white px-3 py-2.5 text-pastel-black"
              >
                <option value="">Select</option>
                <option value="Gentle">Gentle</option>
                <option value="Balanced">Balanced</option>
                <option value="Structured">Structured</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pastel-black">Monthly salary range</label>
              <select
                value={data.monthlySalaryRange ?? ''}
                onChange={(e) => update('monthlySalaryRange', e.target.value as HostOnboardingInput['monthlySalaryRange'])}
                className="w-full rounded-lg border border-light-green/60 bg-off-white px-3 py-2.5 text-pastel-black"
              >
                <option value="">Select</option>
                <option value="€1000-€2000">€1000–€2000</option>
                <option value="€2000-€4000">€2000–€4000</option>
                <option value="€4000+">€4000+</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pastel-black">Contract type</label>
              <select
                value={data.preferredContractType ?? ''}
                onChange={(e) => update('preferredContractType', e.target.value as HostOnboardingInput['preferredContractType'])}
                className="w-full rounded-lg border border-light-green/60 bg-off-white px-3 py-2.5 text-pastel-black"
              >
                <option value="">Select</option>
                <option value="Part time">Part time</option>
                <option value="Full time">Full time</option>
                <option value="Seasonal">Seasonal</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pastel-black">About you and the family</label>
              <textarea
                value={data.aboutFamily ?? ''}
                onChange={(e) => update('aboutFamily', e.target.value)}
                placeholder="A few words about your family and daily life..."
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
        <Link href="/host/dashboard" className="text-dark-green font-medium hover:underline">
          Skip for now — go to dashboard
        </Link>
      </p>
    </div>
  );
}
