import { DailyDashboard } from "@/components/dashboard/daily-dashboard";
import { getEntryForDate, getLatestEntry, getOperatingSystemProfile } from "@/lib/data";
import { getCurrentUser } from "@/lib/supabase/server";
import { OperatingSystemProfile } from "@/lib/types";

function getLocalDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  const today = getLocalDateString();
  const entry = user ? (await getEntryForDate(user.id, today)) ?? (await getLatestEntry(user.id)) : null;
  const operatingSystem: OperatingSystemProfile = user
    ? await getOperatingSystemProfile(user.id)
    : {
        fixedCommitments: [],
        dailyRituals: [],
        minimumStandards: [],
        sequencingRules: [],
        fallbackRules: [],
        identityRules: []
      };

  return (
    <main className="container py-6 sm:py-10">
      <DailyDashboard
        initialEntry={entry}
        defaultDate={today}
        persistenceEnabled={Boolean(user)}
        initialOperatingSystem={operatingSystem}
      />
    </main>
  );
}
