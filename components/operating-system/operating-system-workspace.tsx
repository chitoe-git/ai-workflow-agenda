"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CommandRail } from "@/components/dashboard/command-rail";
import { OperatingSystemForm } from "@/components/operating-system/operating-system-form";
import { OperatingSystemProfile } from "@/lib/types";

const localOperatingSystemKey = "agenda-operating-system-v1";

type OperatingSystemWorkspaceProps = {
  persistenceEnabled: boolean;
  initialOperatingSystem: OperatingSystemProfile;
};

export function OperatingSystemWorkspace({
  persistenceEnabled,
  initialOperatingSystem
}: OperatingSystemWorkspaceProps) {
  const [operatingSystem, setOperatingSystem] = useState<OperatingSystemProfile>(initialOperatingSystem);

  useEffect(() => {
    setOperatingSystem(initialOperatingSystem);
    if (persistenceEnabled) {
      return;
    }

    const stored = window.localStorage.getItem(localOperatingSystemKey);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as OperatingSystemProfile;
      setOperatingSystem({
        fixedCommitments: parsed.fixedCommitments ?? [],
        dailyRituals: parsed.dailyRituals ?? [],
        minimumStandards: parsed.minimumStandards ?? [],
        sequencingRules: parsed.sequencingRules ?? [],
        fallbackRules: parsed.fallbackRules ?? [],
        identityRules: parsed.identityRules ?? []
      });
    } catch {
      setOperatingSystem(initialOperatingSystem);
    }
  }, [initialOperatingSystem, persistenceEnabled]);

  function handleSaved(profile: OperatingSystemProfile) {
    setOperatingSystem(profile);
    if (!persistenceEnabled) {
      window.localStorage.setItem(localOperatingSystemKey, JSON.stringify(profile));
    }
  }

  return (
    <main className="container py-6 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <CommandRail activeSection="operating" mode="operating" />

        <div className="space-y-6">
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-ink">Operating system</h1>
                <p className="mt-1 text-sm text-ink-subtle">
                  Set your non-negotiables once so daily plans stay aligned to how you actually operate.
                </p>
              </div>
              <Badge>{persistenceEnabled ? "Synced mode" : "Local mode"}</Badge>
            </div>
          </section>

          <OperatingSystemForm
            persistEnabled={persistenceEnabled}
            initial={operatingSystem}
            onSaved={handleSaved}
          />

          <Card className="p-0">
            <CardHeader>
              <CardTitle>How this is used</CardTitle>
              <CardDescription>
                The scheduler reads fixed commitments and minimum standards before it schedules flexible tasks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-ink-subtle">
              <p>1. Fixed commitments are treated like hard constraints.</p>
              <p>2. Daily rituals are placed around commitment blocks.</p>
              <p>3. Minimum standards are protected before lower-priority work.</p>
              <p>4. Fallback rules are applied when your day is overloaded.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
