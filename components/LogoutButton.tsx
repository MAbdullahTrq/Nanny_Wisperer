'use client';

import { signOut } from 'next-auth/react';

export default function LogoutButton({
  className = '',
}: {
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/' })}
      className={`text-sm font-medium text-dark-green hover:text-pastel-black transition-colors ${className}`}
    >
      Log out
    </button>
  );
}
