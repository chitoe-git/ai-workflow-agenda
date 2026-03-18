import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const operatingSystemSchema = z.object({
  fixedCommitments: z.array(z.string()).default([]),
  dailyRituals: z.array(z.string()).default([]),
  minimumStandards: z.array(z.string()).default([]),
  sequencingRules: z.array(z.string()).default([]),
  fallbackRules: z.array(z.string()).default([]),
  identityRules: z.array(z.string()).default([])
});

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const input = operatingSystemSchema.parse(body);

    const { error } = await supabase.from("user_operating_system").upsert(
      {
        user_id: user.id,
        fixed_commitments: input.fixedCommitments,
        daily_rituals: input.dailyRituals,
        minimum_standards: input.minimumStandards,
        sequencing_rules: input.sequencingRules,
        fallback_rules: input.fallbackRules,
        identity_rules: input.identityRules
      },
      { onConflict: "user_id" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
