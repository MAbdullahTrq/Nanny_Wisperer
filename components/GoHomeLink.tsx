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
  const user = session?.user as { userType?: string; isAdmin?: boolean; isMatchmaker?: boolean } | undefined;
  const href =
    status === 'authenticated' && user?.isAdmin
      ? '/admin'
      : status === 'authenticated' && user?.isMatchmaker
        ? '/matchmaker'
        : status === 'authenticated' && user?.userType === 'Nanny'
          ? '/nanny/dashboard'
          : status === 'authenticated' && user?.userType === 'Host'
            ? '/host/dashboard'
            : '/';

  return (
    <Link href={href} className={className} style={style}>
      {children}
    </Link>
  );
}
