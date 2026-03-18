"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OperatingSystemProfile } from "@/lib/types";
import { linesToArray } from "@/lib/utils";

const emptyProfile: OperatingSystemProfile = {
  fixedCommitments: [],
  dailyRituals: [],
  minimumStandards: [],
  sequencingRules: [],
  fallbackRules: [],
  identityRules: []
};

type OperatingSystemFormProps = {
  persistEnabled: boolean;
  initial: OperatingSystemProfile;
  onSaved: (profile: OperatingSystemProfile) => void;
};

export function OperatingSystemForm({ persistEnabled, initial, onSaved }: OperatingSystemFormProps) {
  const [fixedCommitments, setFixedCommitments] = useState(initial.fixedCommitments.join("\n"));
  const [dailyRituals, setDailyRituals] = useState(initial.dailyRituals.join("\n"));
  const [minimumStandards, setMinimumStandards] = useState(initial.minimumStandards.join("\n"));
  const [sequencingRules, setSequencingRules] = useState(initial.sequencingRules.join("\n"));
  const [fallbackRules, setFallbackRules] = useState(initial.fallbackRules.join("\n"));
  const [identityRules, setIdentityRules] = useState(initial.identityRules.join("\n"));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFixedCommitments(initial.fixedCommitments.join("\n"));
    setDailyRituals(initial.dailyRituals.join("\n"));
    setMinimumStandards(initial.minimumStandards.join("\n"));
    setSequencingRules(initial.sequencingRules.join("\n"));
    setFallbackRules(initial.fallbackRules.join("\n"));
    setIdentityRules(initial.identityRules.join("\n"));
  }, [initial]);

  function buildProfile(): OperatingSystemProfile {
    return {
      fixedCommitments: linesToArray(fixedCommitments),
      dailyRituals: linesToArray(dailyRituals),
      minimumStandards: linesToArray(minimumStandards),
      sequencingRules: linesToArray(sequencingRules),
      fallbackRules: linesToArray(fallbackRules),
      identityRules: linesToArray(identityRules)
    };
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const profile = buildProfile();

    if (!persistEnabled) {
      onSaved(profile);
      setMessage("Operating system saved locally.");
      setSaving(false);
      return;
    }

    const response = await fetch("/api/operating-system", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile)
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Unable to save operating system.");
      setSaving(false);
      return;
    }

    setMessage("Operating system saved.");
    onSaved(profile);
    setSaving(false);
  }

  return (
    <Card id="section-operating" className="p-0">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Operating system</CardTitle>
            <CardDescription>
              Your defaults for non-negotiables, sequencing, and fallback rules. The scheduler reads these first.
            </CardDescription>
          </div>
          <Badge>Core rules</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSave}>
          <div className="space-y-2">
            <Label htmlFor="fixedCommitments">Fixed commitments (weekdays/time windows)</Label>
            <Textarea
              id="fixedCommitments"
              value={fixedCommitments}
              onChange={(event) => setFixedCommitments(event.target.value)}
              placeholder={"Trade live: Monday-Friday 8:30 AM-10:00 AM\nClass: Tuesday/Thursday 1:00 PM-2:15 PM"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dailyRituals">Daily rituals (prep routines)</Label>
            <Textarea
              id="dailyRituals"
              value={dailyRituals}
              onChange={(event) => setDailyRituals(event.target.value)}
              placeholder={"Coffee + affirmations before trade session\n10-minute shutdown review before bed"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="minimumStandards">Minimum standards (must happen)</Label>
            <Textarea
              id="minimumStandards"
              value={minimumStandards}
              onChange={(event) => setMinimumStandards(event.target.value)}
              placeholder={"Backtesting + trade review: 2 hours daily\nWorkout minimum: 30 minutes\nSleep: 7.5 hours"}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sequencingRules">Sequencing rules</Label>
              <Textarea
                id="sequencingRules"
                value={sequencingRules}
                onChange={(event) => setSequencingRules(event.target.value)}
                placeholder={"Do deep work before reactive tasks\nReview trades after market block"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fallbackRules">Fallback rules (low-energy defaults)</Label>
              <Textarea
                id="fallbackRules"
                value={fallbackRules}
                onChange={(event) => setFallbackRules(event.target.value)}
                placeholder={"If low energy, do 20-minute review minimum\nIf overloaded, preserve trade + workout minimums"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="identityRules">Identity rules</Label>
            <Textarea
              id="identityRules"
              value={identityRules}
              onChange={(event) => setIdentityRules(event.target.value)}
              placeholder={"I execute the first hard task before noon.\nI keep promises to myself, especially when tired."}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-ink-subtle">
              {persistEnabled ? "Synced to your account." : "Local mode: saved in this browser for testing."}
            </p>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save operating system"}
            </Button>
          </div>
          {message ? <p className="text-sm text-success">{message}</p> : null}
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}

export function getEmptyOperatingSystem(): OperatingSystemProfile {
  return emptyProfile;
}
