import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Get the current authenticated user (server-side)
 * Use this in Server Components and API Routes
 */
export async function getUser() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Check if user is authenticated (returns user ID or null)
 */
export async function getUserId(): Promise<string | null> {
  const user = await getUser();
  return user?.id || null;
}

/**
 * Require authentication - throws if not authenticated
 * Use this in API routes that require auth
 */
export async function requireAuth() {
  const user = await getUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}
