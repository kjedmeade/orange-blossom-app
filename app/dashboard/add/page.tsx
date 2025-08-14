"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import { ensureProfile } from "../../utils/ensureProfile";
import { CATEGORY_VALUES } from "../../utils/constants";

export default function AddIdeaPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [supplies, setSupplies] = useState("");
  const [timeRequired, setTimeRequired] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setIsAuthed(!!data.session);
      setAuthChecked(true);
      if (!data.session) {
        window.location.replace('/login');
      } else {
        ensureProfile();
      }
    };
    check();
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return;
      setIsAuthed(!!session);
      if (!session) window.location.replace('/login');
    });
    return () => { mounted = false; listener?.subscription.unsubscribe(); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError('Title is required'); return; }
    if (!description.trim()) { setError('Description is required'); return; }
    const minutes = typeof timeRequired === 'number' ? timeRequired : Number(timeRequired);
    if (!minutes || minutes <= 0) { setError('Time required must be > 0'); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); setSaving(false); return; }
    const { error: insertError } = await supabase.from('self_care_ideas').insert({
      user_id: user.id,
      title: title.trim(),
      category: category || null,
      description: description.trim(),
      supplies: supplies.trim() || null,
      time_required: minutes
    });
    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }
    window.location.replace('/dashboard');
  };

  if (!authChecked) return <div className="min-h-screen flex items-center justify-center text-gray-400">Checking authentication...</div>;
  if (!isAuthed) return null;

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-xl flex justify-between items-center mb-4">
        <a href="/dashboard" className="font-bold tracking-widest text-gray-700 text-base border border-gray-300 rounded px-4 py-2 hover:border-orange-300 transition">Orange Blossom</a>
        <div className="flex gap-3">
          <a href="/dashboard" className="border border-gray-300 rounded px-4 py-2 text-gray-500 hover:border-orange-300 transition">Dashboard</a>
          <a href="/profile" className="border border-gray-300 rounded px-4 py-2 text-gray-500 hover:border-orange-300 transition">Profile</a>
        </div>
      </div>
      <h1 className="text-2xl font-bold mb-6 text-gray-700">Add Self Care Idea</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-xl border border-gray-200 rounded-lg p-6 bg-white shadow-sm flex flex-col gap-5">
        {error && <div className="text-sm text-red-500">{error}</div>}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-600">Title *</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-orange-300" placeholder="e.g. 5‑minute breathing reset" />
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
          <textarea value={description} onChange={e=>setDescription(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-orange-300 min-h-[120px]" placeholder="Describe the steps..." />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-600">Supplies (optional)</label>
          <input value={supplies} onChange={e=>setSupplies(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-orange-300" placeholder="Yoga mat, notebook..." />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="border border-gray-300 rounded px-5 py-2 text-gray-600 hover:border-orange-300 disabled:opacity-50">{saving? 'Saving...' : 'Save Idea'}</button>
          <a href="/dashboard" className="border border-gray-300 rounded px-5 py-2 text-gray-500 hover:border-orange-300">Cancel</a>
        </div>
      </form>
    </div>
  );
}
