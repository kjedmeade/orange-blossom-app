"use client";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { ensureProfile } from "../utils/ensureProfile";

interface ProfileRow {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
}

export default function ProfilePage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");

  // Auth guard similar to dashboard
  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setIsAuthed(!!data.session);
      setAuthChecked(true);
      if (!data.session) {
        window.location.replace("/login");
      }
    };
    check();
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!isMounted) return;
      setIsAuthed(!!session);
      if (!session) {
        window.location.replace("/login");
      }
    });
    return () => {
      isMounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Load profile
  useEffect(() => {
    if (!isAuthed) return;
    const load = async () => {
      setLoadingProfile(true);
      await ensureProfile();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, email")
        .eq("id", user.id)
        .single();
      if (error) {
        setError(error.message);
      } else if (data) {
        setProfile(data as ProfileRow);
        setUsername(data.username || "");
        setFullName(data.full_name || "");
      }
      setLoadingProfile(false);
    };
    load();
  }, [isAuthed]);

  const handleSave = async () => {
    if (!profile) return;
    setError(null);
    setStatus(null);
    const cleanedUser = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 32);
    if (!cleanedUser) {
      setError("Username required");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ username: cleanedUser, full_name: fullName || null, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    if (error) {
      if ((error as any).code === "23505") {
        setError("Username already taken");
      } else {
        setError(error.message);
      }
    } else {
      setStatus("Profile updated");
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.replace("/login");
  };

  if (!authChecked) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Checking authentication...</div>;
  }
  if (!isAuthed) return null;

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col items-center px-4 py-8">
      {/* Top Nav */}
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
            className="border border-orange-300 rounded px-4 py-2 text-gray-700 bg-orange-50"
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

      <h1 className="text-2xl font-bold mb-6 text-gray-700">Profile</h1>

      {loadingProfile ? (
        <div className="text-gray-400">Loading profile...</div>
      ) : error ? (
        <div className="text-red-500 text-sm mb-4">{error}</div>
      ) : (
        <div className="w-full max-w-xl border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm text-gray-600">
              <span className="font-medium">Email (read-only)</span>
              <input
                value={profile?.email || ""}
                disabled
                className="border border-gray-300 rounded px-3 py-2 text-gray-500 bg-gray-50 cursor-not-allowed"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-gray-600">
              <span className="font-medium">Username</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                className="border border-gray-300 rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-orange-300"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-gray-600">
              <span className="font-medium">Full Name</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                className="border border-gray-300 rounded px-3 py-2 text-gray-700 focus:outline-none focus:border-orange-300"
              />
            </label>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="border border-gray-300 rounded px-4 py-2 text-gray-600 hover:border-orange-300 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              {status && <span className="text-xs text-green-600">{status}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
