"use client";

import { AvailabilityProvider } from "@/lib/AvailabilityContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AvailabilityProvider>{children}</AvailabilityProvider>;
}
