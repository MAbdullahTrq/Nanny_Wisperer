import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { Card } from '@/components/ui';

export default async function NannyProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/nanny/profile');

  const user = session.user as {
    email?: string | null;
    name?: string | null;
    image?: string | null;
    airtableNannyId?: string;
  };
  const email = user.email ?? '';
  const name = user.name ?? null;
  const image = user.image ?? null;
  const onboardingComplete = Boolean(user.airtableNannyId);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        Profile
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">
        Your account details and profile settings.
      </p>

      <div className="space-y-6 max-w-xl">
        <Card className="p-6 bg-light-green/5 border-light-green/50">
          <h2 className="font-medium text-pastel-black mb-4">Account</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-light-green flex items-center justify-center text-dark-green text-xl font-semibold shrink-0 overflow-hidden">
              {image ? (
                <img src={image} alt="" className="w-full h-full object-cover" />
              ) : (
                (name || email).charAt(0).toUpperCase()
              )}
            </div>
            <div>
              {name && (
                <p className="font-medium text-pastel-black">{name}</p>
              )}
              <p className="text-dark-green/90 text-sm">{email}</p>
            </div>
          </div>
          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium bg-transparent text-dark-green hover:bg-light-green/40 border border-transparent transition-colors"
          >
            Change password
          </Link>
        </Card>

        <Card
          className={`p-6 ${onboardingComplete ? 'bg-light-green/5 border-light-green/50' : 'border-light-pink/50 bg-light-pink/20'}`}
        >
          <h2 className="font-medium text-pastel-black mb-2">
            Caregiver profile (onboarding)
          </h2>
          {onboardingComplete ? (
            <>
              <p className="text-dark-green/80 text-sm mb-4">
                Your caregiver profile is complete. You can update your details anytime.
              </p>
              <Link
                href="/nanny/onboarding"
                className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium bg-light-green text-pastel-black hover:bg-light-green/80 border border-light-green transition-colors"
              >
                Edit caregiver profile
              </Link>
            </>
          ) : (
            <>
              <p className="text-dark-green/90 text-sm mb-4">
                Complete your profile to appear in shortlists and get matched with families.
              </p>
              <Link
                href="/nanny/onboarding"
                className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium bg-dark-green text-off-white hover:bg-dark-green/90 border border-dark-green transition-colors"
              >
                Complete onboarding
              </Link>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
