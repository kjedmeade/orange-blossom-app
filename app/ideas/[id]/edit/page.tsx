"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../utils/supabaseClient";
import { ensureProfile } from "../../../utils/ensureProfile";
import { CATEGORY_VALUES } from "../../../utils/constants";

export default function EditIdeaPage() {
  const params = useParams();
  const router = useRouter();
  const ideaId = params?.id as string;

  const [authChecked, setAuthChecked] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [supplies, setSupplies] = useState("");
  const [timeRequired, setTimeRequired] = useState<number | ''>('');

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setSessionUserId(session?.user?.id || null);
      setAuthChecked(true);
      if (!session) {
        router.replace('/login');
        return;
      }
      ensureProfile();
    };
    init();
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return;
      setSessionUserId(session?.user?.id || null);
      if (!session) router.replace('/login');
    });
    return () => { mounted = false; listener?.subscription.unsubscribe(); };
  }, [router]);

  useEffect(() => {
    if (!ideaId || !sessionUserId) return;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('self_care_ideas')
        .select('*')
        .eq('id', ideaId)
        .single();
      if (error) {
        setError(error.message);
      } else if (data) {
        if (data.user_id !== sessionUserId) {
          setError('You do not have permission to edit this idea');
        } else {
          setTitle(data.title || '');
            setCategory(data.category || '');
            setDescription(data.description || '');
            setSupplies(data.supplies || '');
            setTimeRequired(data.time_required || '');
        }
      }
      setLoading(false);
    };
    load();
  }, [ideaId, sessionUserId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError('Title required'); return; }
    if (!description.trim()) { setError('Description required'); return; }
    if (!timeRequired || timeRequired <= 0) { setError('Time required must be > 0'); return; }
    setSaving(true);
    const { error } = await supabase
      .from('self_care_ideas')
      .update({
        title: title.trim(),
        category: category.trim() || null,
        description: description.trim(),
        supplies: supplies.trim() || null,
        time_required: timeRequired,
        updated_at: new Date().toISOString()
      })
      .eq('id', ideaId);
    if (error) {
      setError(error.message);
    } else {
      router.push(`/ideas/${ideaId}`);
    }
    setSaving(false);
  };

  if (!authChecked) return <div className="min-h-screen flex items-center justify-center text-gray-400">Checking authentication...</div>;
  if (!sessionUserId) return null;

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-xl flex justify-between items-center mb-4">
        <a href="/dashboard" className="font-bold tracking-widest text-gray-700 text-base border border-gray-300 rounded px-4 py-2 hover:border-orange-300 transition">Orange Blossom</a>
        <div className="flex gap-3">
          <a href="/dashboard" className="border border-gray-300 rounded px-4 py-2 text-gray-500 hover:border-orange-300 transition">Dashboard</a>
          <a href="/profile" className="border border-gray-300 rounded px-4 py-2 text-gray-500 hover:border-orange-300 transition">Profile</a>
        </div>
      </div>
      <h1 className="text-2xl font-bold mb-6 text-gray-700">Edit Idea</h1>
      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : error ? (
        <div className="text-red-500 text-sm max-w-xl mb-4">{error}</div>
      ) : (
        <form onSubmit={handleSave} className="w-full max-w-xl border border-gray-200 rounded-lg p-6 bg-white shadow-sm flex flex-col gap-5">
          {error && <div className="text-sm text-red-500">{error}</div>}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Title *</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-orange-300" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Category</label>
            <select value={category} onChange={e=>setCategory(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-orange-300">
              <option value="">Select a category</option>
              {CATEGORY_VALUES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Time Required (minutes) *</label>
            <input type="number" value={timeRequired} onChange={e=>setTimeRequired(e.target.value? parseInt(e.target.value,10): '')} className="border border-gray-300 rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-orange-300" min={1} max={240} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Description *</label>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-orange-300 min-h-[120px]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Supplies (optional)</label>
            <input value={supplies} onChange={e=>setSupplies(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-orange-300" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="border border-gray-300 rounded px-5 py-2 text-gray-600 hover:border-orange-300 disabled:opacity-50">{saving? 'Saving...' : 'Save Changes'}</button>
            <a href={`/ideas/${ideaId}`} className="border border-gray-300 rounded px-5 py-2 text-gray-500 hover:border-orange-300">Cancel</a>
          </div>
        </form>
      )}
    </div>
  );
}
