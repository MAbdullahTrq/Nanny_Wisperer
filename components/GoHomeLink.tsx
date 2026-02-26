'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export function GoHomeLink({
  className = '',
  style,
  children = 'Go Home',
}: {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const userType = (session?.user as { userType?: string } | undefined)?.userType;
  const href =
    status === 'authenticated' && userType === 'Nanny'
      ? '/nanny/dashboard'
      : status === 'authenticated' && userType === 'Host'
        ? '/host/dashboard'
        : '/';

  return (
    <Link href={href} className={className} style={style}>
      {children}
    </Link>
  );
}
