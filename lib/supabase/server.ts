import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookiePair = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiePairs: CookiePair[]) {
          try {
            cookiePairs.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as any);
            });
          } catch {
            // Server Components cannot always mutate cookies.
          }
        }
      }
    }
  );
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}
