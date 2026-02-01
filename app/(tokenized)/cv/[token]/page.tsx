import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { validateToken } from '@/lib/auth/tokens';
import { getMatch } from '@/lib/airtable/matches';
import { getNanny } from '@/lib/airtable/nannies';
import { Card } from '@/components/ui';
import CvProceedPassClient from './CvProceedPassClient';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: { token: string };
}

function NannyField({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === undefined || value === null || value === '') return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  return (
    <div className="mb-3">
      <p className="text-sm font-medium text-dark-green/80">{label}</p>
      <p className="text-pastel-black">{display}</p>
    </div>
  );
}

export default async function CvTokenPage({ params }: PageProps) {
  const payload = validateToken(params.token);
  if (!payload || payload.type !== 'cv' || !payload.matchId) {
    notFound();
  }

  const [match, nanny] = await Promise.all([
    getMatch(payload.matchId),
    payload.nannyId ? getNanny(payload.nannyId) : null,
  ]);

  if (!match?.nannyId) notFound();
  const nannyId = match.nannyId;
  const nannyData = nanny ?? await getNanny(nannyId);
  if (!nannyData) notFound();

  const name = [nannyData.firstName, nannyData.lastName].filter(Boolean).join(' ') || 'Nanny';
  const initial = name.charAt(0).toUpperCase();
  const bothProceeded = Boolean(match.hostProceed && match.nannyProceed);

  return (
    <div className="min-h-screen bg-off-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-light-green flex items-center justify-center text-dark-green font-semibold text-2xl">
            {initial}
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-pastel-black">{name}</h1>
            {match.score != null && (
              <p className="text-dark-green/80">Match score: {match.score}%</p>
            )}
          </div>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="font-medium text-pastel-black mb-4">Profile & contact</h2>
          <NannyField label="Date of birth" value={nannyData.dateOfBirth} />
          <NannyField label="Gender" value={nannyData.gender} />
          <NannyField label="Phone" value={nannyData.phone} />
          <NannyField label="City / Country" value={nannyData.city ?? nannyData.country} />
          <NannyField label="Current location" value={nannyData.currentLocation} />
          <NannyField label="Nationality" value={nannyData.nationality} />
          <NannyField label="Childcare experience" value={nannyData.hasChildcareExperience} />
          <NannyField label="Driving licence" value={nannyData.hasDrivingLicence} />
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="font-medium text-pastel-black mb-4">Schedule & experience</h2>
          <NannyField label="Available start date" value={nannyData.availableStartDate} />
          <NannyField label="Years of experience" value={nannyData.yearsChildcareExperience} />
          <NannyField label="Age groups" value={Array.isArray(nannyData.ageGroupsWorkedWith) ? nannyData.ageGroupsWorkedWith.join(', ') : nannyData.ageGroupsWorkedWith} />
          <NannyField label="Special needs experience" value={nannyData.specialNeedsExperience} />
          <NannyField label="Max children comfortable with" value={nannyData.maxChildrenComfortable} />
          <NannyField label="Available weekends" value={nannyData.availableWeekends} />
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="font-medium text-pastel-black mb-4">Skills & lifestyle</h2>
          <NannyField label="Cooking" value={nannyData.canCook} />
          <NannyField label="Tutoring / homework" value={nannyData.tutoringHomework} />
          <NannyField label="Light housekeeping" value={nannyData.lightHousekeeping} />
          <NannyField label="Travel and support" value={nannyData.okToTravelAndSupport} />
          <NannyField label="Comfortable with pets" value={nannyData.comfortableWithPets} />
          <NannyField label="Smokes" value={nannyData.smokes} />
          <NannyField label="Parenting style preference" value={nannyData.parentingStylePreference} />
        </Card>

        {nannyData.aboutMe && (
          <Card className="p-6 mb-6">
            <h2 className="font-medium text-pastel-black mb-4">About</h2>
            <p className="text-dark-green whitespace-pre-wrap">{nannyData.aboutMe}</p>
          </Card>
        )}

        <CvProceedPassClient
          token={params.token}
          matchId={payload.matchId}
          currentStatus={{ hostProceed: match.hostProceed, nannyProceed: match.nannyProceed }}
        />

        {bothProceeded && (
          <div className="mt-6 p-4 rounded-lg bg-light-green/50 text-dark-green text-center">
            <p className="font-medium">Both parties have proceeded.</p>
            <p className="text-sm mt-1">Open chat or schedule an interview.</p>
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              <Link
                href={`/chat/open/${payload.matchId}`}
                className="rounded-lg bg-dark-green text-off-white px-4 py-2 text-sm font-medium hover:bg-dark-green/90 transition-colors"
              >
                Open chat
              </Link>
              <Link href="#" className="text-dark-green font-medium hover:underline">
                Schedule interview (placeholder)
              </Link>
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-dark-green/60">
          <Link href="#" className="hover:underline">Back to shortlist</Link>
          {' · '}
          Link expires after 7 days.
        </p>
      </div>
    </div>
  );
}
