"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../utils/supabaseClient";
import { ensureProfile } from "../../utils/ensureProfile";

interface Idea {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  supplies: string | null;
  time_required: number | null;
  user_id: string;
  profiles?: { username?: string };
}

export default function IdeaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ideaId = params?.id as string;
  const [authChecked, setAuthChecked] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setSessionUserId(session?.user?.id || null);
      setAuthChecked(true);
      ensureProfile();
    };
    init();
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return;
      setSessionUserId(session?.user?.id || null);
    });
    return () => { mounted = false; listener?.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!ideaId) return;
    const fetchIdea = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("self_care_ideas")
        .select("id, title, category, description, supplies, time_required, user_id, profiles:profiles!self_care_ideas_user_id_fkey(username)")
        .eq("id", ideaId)
        .single();
      if (error) setError(error.message); else setIdea(data as Idea);
      setLoading(false);
    };
    fetchIdea();
  }, [ideaId]);

  const handleDelete = async () => {
    if (!idea) return;
    if (!confirm("Delete this idea?")) return;
    setDeleting(true);
    const { error } = await supabase.from("self_care_ideas").delete().eq("id", idea.id);
    if (error) {
      alert(error.message);
      setDeleting(false);
      return;
    }
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 font-sans flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-2xl flex justify-between items-center mb-6">
        <a href="/dashboard" className="font-bold tracking-widest text-gray-700 text-base border border-gray-300/70 rounded px-4 py-2 hover:border-orange-300 transition bg-white/60 backdrop-blur-sm">Orange Blossom</a>
        <div className="flex gap-3">
          <a href="/dashboard" className="border border-gray-300 rounded px-4 py-2 text-gray-500 hover:border-orange-300 transition bg-white/70">Dashboard</a>
          <a href="/profile" className="border border-gray-300 rounded px-4 py-2 text-gray-500 hover:border-orange-300 transition bg-white/70">Profile</a>
        </div>
      </div>
      {loading ? (
        <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-sm p-6 animate-pulse">
          <div className="h-6 w-1/3 bg-gray-200 rounded mb-4" />
          <div className="flex gap-2 mb-6">
            <div className="h-5 w-16 bg-gray-200 rounded" />
            <div className="h-5 w-20 bg-gray-200 rounded" />
          </div>
          <div className="space-y-3">
            <div className="h-3 w-full bg-gray-200 rounded" />
            <div className="h-3 w-5/6 bg-gray-200 rounded" />
            <div className="h-3 w-2/3 bg-gray-200 rounded" />
          </div>
        </div>
      ) : error ? (
        <div className="w-full max-w-2xl text-red-500 text-sm border border-red-200 bg-red-50 rounded-lg p-4">{error}</div>
      ) : !idea ? (
        <div className="text-gray-400">Not found.</div>
      ) : (
        <div className="w-full max-w-2xl flex flex-col gap-6">
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="p-6 flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-semibold leading-snug text-gray-800 flex-1">{idea.title}</h1>
              </div>
              <div className="flex flex-wrap gap-2">
                {idea.category && <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-medium border border-orange-200">{idea.category}</span>}
                {idea.time_required && <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">{idea.time_required} min</span>}
                {idea.profiles?.username && <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs border border-gray-200">by {idea.profiles.username}</span>}
              </div>
              {idea.description && (
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
                  {idea.description}
                </div>
              )}
              {idea.supplies && (
                <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <span className="font-medium text-gray-700">Supplies:</span> {idea.supplies}
                </div>
              )}
              {sessionUserId === idea.user_id && (
                <div className="flex flex-wrap gap-3 pt-2">
                  <a href={`/ideas/${idea.id}/edit`} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:border-orange-300 hover:text-orange-600 transition text-sm">Edit</a>
                  <button onClick={handleDelete} disabled={deleting} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-red-300 text-red-500 hover:border-red-500 hover:bg-red-50 transition text-sm disabled:opacity-50">{deleting ? 'Deleting…' : 'Delete'}</button>
                </div>
              )}
              <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                <a href="/dashboard" className="text-sm text-gray-500 hover:text-orange-600 transition">← Back to dashboard</a>
                <div className="text-[11px] text-gray-400">Self Care Idea</div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
