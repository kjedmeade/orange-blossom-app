import { supabase } from './supabaseClient';

// Ensures a profile row exists for the current authenticated user.
// If missing, inserts a minimal record derived from the email.
export async function ensureProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: existing, error: selectErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();
  if (selectErr && selectErr.code !== 'PGRST116') {
    // PGRST116 = No rows found; ignore
    return;
  }
  if (!existing) {
    const base = (user.email?.split('@')[0] || user.id)
      .replace(/[^a-zA-Z0-9_]/g, '')
      .slice(0, 24) || user.id;
    await supabase.from('profiles').insert({
      id: user.id,
      username: base.toLowerCase(),
      full_name: null,
      email: user.email
    });
  }
}

