"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../utils/supabaseClient";
import { ensureProfile } from "../utils/ensureProfile";

export default function Dashboard() {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const categories = ["Creative","Relaxing","Mindful","Energizing","Restorative","Social","Financial","Nourishing","Organizing","Learning","Nature-based","Reflective","Playful","Confidence-building","Gratifying"];
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      // Use Supabase's recommended session check
      const { data } = await supabase.auth.getSession();
      if (isMounted) {
        setIsAuthed(!!data.session);
        setAuthChecked(true);
        if (!data.session) {
          // Prevent rendering and redirect immediately
          window.location.replace("/login");
        }
      }
    };
    checkSession();
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setIsAuthed(!!session);
        setAuthChecked(true);
        if (!session) {
          window.location.replace("/login");
        }
      }
    });
    return () => {
      isMounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authChecked && !isAuthed) {
      window.location.replace("/login");
    }
  }, [authChecked, isAuthed]);

  useEffect(() => {
    if (isAuthed) {
      async function fetchIdeas(reset = false) {
        if (reset) {
          setIdeas([]);
          setPage(0);
        }
        setLoading(true);
        let from = reset ? 0 : page * PAGE_SIZE;
        let to = from + PAGE_SIZE - 1;
        let query = supabase
          .from("self_care_ideas")
          .select("id, title, category, description, supplies, time_required, profiles:profiles!self_care_ideas_user_id_fkey(username)")
          .order("created_at", { ascending: false })
          .range(from, to);
        if (categoryFilter) query = query.eq("category", categoryFilter);
        if (timeFilter) {
          if (timeFilter === "15") query = query.lte("time_required", 15);
          else if (timeFilter === "30") query = query.lte("time_required", 30);
          else if (timeFilter === "60+") query = query.gte("time_required", 60);
        }
        if (search.trim()) {
          const term = search.trim();
            query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
        }
        const { data, error } = await query;
        if (!error && data) {
          setIdeas(prev => (reset ? data : [...prev, ...data]));
        }
        setLoading(false);
      }
      fetchIdeas(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, categoryFilter, timeFilter, search]);

  const loadMore = async () => {
    setPage(p => p + 1);
    const nextPage = page + 1;
    setLoading(true);
    let from = nextPage * PAGE_SIZE;
    let to = from + PAGE_SIZE - 1;
    let query = supabase
      .from("self_care_ideas")
      .select("id, title, category, description, supplies, time_required, profiles:profiles!self_care_ideas_user_id_fkey(username)")
      .order("created_at", { ascending: false })
      .range(from, to);
    if (categoryFilter) query = query.eq("category", categoryFilter);
    if (timeFilter) {
      if (timeFilter === "15") query = query.lte("time_required", 15);
      else if (timeFilter === "30") query = query.lte("time_required", 30);
      else if (timeFilter === "60+") query = query.gte("time_required", 60);
    }
    if (search.trim()) {
      const term = search.trim();
      query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
    }
    const { data } = await query;
    if (data) setIdeas(prev => [...prev, ...data]);
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthed) {
      ensureProfile();
    }
  }, [isAuthed]);

  // Add logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.replace("/login");
  };

  if (!authChecked) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Checking authentication...</div>;
  }
  if (!isAuthed) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-xl flex justify-between items-center mb-4">
        <a
          href="/dashboard"
          className="font-bold tracking-widest text-gray-700 text-base border border-gray-300 rounded px-4 py-2 hover:border-orange-300 transition"
        >
          Orange Blossom
        </a>
        <div className="flex gap-3">
          <a
            href="/dashboard"
            className="border border-gray-300 rounded px-4 py-2 text-gray-500 hover:border-orange-300 transition"
          >
            Dashboard
          </a>
          <a
            href="/profile"
            className="border border-gray-300 rounded px-4 py-2 text-gray-500 hover:border-orange-300 transition"
          >
            Profile
          </a>
          <button
            onClick={handleLogout}
            className="border border-gray-300 rounded px-4 py-2 text-gray-500 hover:border-orange-300 transition"
          >
            Log Out
          </button>
        </div>
      </div>
      <h1 className="text-2xl font-bold mb-6 text-gray-700">Dashboard</h1>
      <div className="w-full max-w-xl flex justify-end mb-6">
        <a
          href="/dashboard/add"
          className="border border-gray-300 rounded px-4 py-2 text-gray-500 hover:border-orange-300 transition"
        >
          Add Idea
        </a>
      </div>
      <div className="w-full max-w-xl border border-gray-200 rounded-lg p-4 mb-6 flex flex-col gap-4 bg-white">
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wide text-gray-400">Search</label>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search title or description" className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-orange-300" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wide text-gray-400">Category</label>
            <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-orange-300">
              <option value="">All</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wide text-gray-400">Time</label>
            <select value={timeFilter} onChange={e=>setTimeFilter(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-orange-300">
              <option value="">Any</option>
              <option value="15">Up to 15</option>
              <option value="30">Up to 30</option>
              <option value="60+">60+</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wide text-gray-400">Actions</label>
            <button onClick={()=>{setSearch("");setCategoryFilter("");setTimeFilter("");}} className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-600 hover:border-orange-300">Reset</button>
          </div>
        </div>
      </div>
      <h2 className="text-lg text-gray-500 mb-8">Self care ideas uploaded by other users</h2>
      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <div className="w-full max-w-xl flex flex-col gap-4">
          {ideas.length === 0 ? (
            <div className="text-gray-400">No self care ideas found.</div>
          ) : (
            ideas.map((idea: any) => (
              <a href={`/ideas/${idea.id}`} key={idea.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:border-orange-300 transition">
                <h3 className="font-semibold text-gray-700 mb-1">{idea.title}</h3>
                <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-2 items-center">
                  {idea.category && <span>{idea.category}</span>}
                  {idea.time_required && <><span>•</span><span>{idea.time_required} min</span></>}
                  {idea.profiles?.username && <><span>•</span><span>by {idea.profiles.username}</span></>}
                </div>
                {idea.description && (
                  <p className="text-gray-500 text-sm line-clamp-3">{idea.description}</p>
                )}
              </a>
            ))
          )}
          {ideas.length > 0 && (
            <button disabled={loading} onClick={loadMore} className="mt-2 self-center border border-gray-300 rounded px-4 py-2 text-gray-600 hover:border-orange-300 disabled:opacity-50">{loading ? 'Loading...' : 'Load More'}</button>
          )}
        </div>
      )}
    </div>
  );
}
