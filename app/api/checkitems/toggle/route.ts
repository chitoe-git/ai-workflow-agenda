import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const toggleSchema = z.object({
  kind: z.enum(["plan", "task"]),
  itemId: z.string().uuid(),
  completed: z.boolean()
});

export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const input = toggleSchema.parse(body);

    const table = input.kind === "plan" ? "plan_blocks" : "tasks";
    const { error } = await supabase
      .from(table)
      .update({ completed: input.completed })
      .eq("id", input.itemId);

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
