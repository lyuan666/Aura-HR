'use client';

import { V2Layout } from '@/components/v2/V2Layout';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <V2Layout>{children}</V2Layout>;
}
