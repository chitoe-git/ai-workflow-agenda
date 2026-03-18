import { OperatingSystemWorkspace } from "@/components/operating-system/operating-system-workspace";
import { getOperatingSystemProfile } from "@/lib/data";
import { getCurrentUser } from "@/lib/supabase/server";
import { OperatingSystemProfile } from "@/lib/types";

export default async function OperatingSystemPage() {
  const user = await getCurrentUser();
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
    <OperatingSystemWorkspace
      persistenceEnabled={Boolean(user)}
      initialOperatingSystem={operatingSystem}
    />
  );
}
