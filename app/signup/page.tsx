import Link from 'next/link';
import { Button, Card } from '@/components/ui';

export default function SignupPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        Join the Private Network
      </h1>
      <p className="text-dark-green/80 text-sm mb-8">
        Choose how you want to join Nanny Whisperer.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/signup/nanny">
          <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
            <h2 className="font-medium text-pastel-black">I am a Nanny / Au Pair</h2>
            <p className="mt-2 text-sm text-dark-green/80">
              Join as a childcare professional. Get matched with families.
            </p>
            <span className="mt-3 inline-block text-sm font-medium text-dark-green">
              Sign up as Nanny →
            </span>
          </Card>
        </Link>
        <Link href="/signup/host">
          <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
            <h2 className="font-medium text-pastel-black">We are a host family</h2>
            <p className="mt-2 text-sm text-dark-green/80">
              Join as a family looking for a nanny. Receive curated shortlists.
            </p>
            <span className="mt-3 inline-block text-sm font-medium text-dark-green">
              Sign up as Host →
            </span>
          </Card>
        </Link>
      </div>

      <p className="mt-8 text-center text-sm text-dark-green/80">
        Already have an account?{' '}
        <Link href="/login" className="text-dark-green font-medium hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
