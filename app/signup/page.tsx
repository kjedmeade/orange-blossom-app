"use client";
import { useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else if (data.user) {
      const rawBase = username || email.split('@')[0];
      const safeUsername = rawBase.replace(/[^a-zA-Z0-9_]+/g, '').slice(0, 24) || data.user.id;
      const { error: profileErr } = await supabase.from('profiles').upsert({
        id: data.user.id,
        username: safeUsername.toLowerCase(),
        full_name: fullName || null,
        email: data.user.email
      });
      if (profileErr) {
        if ((profileErr as any).code === '23505') {
          setError('Username already taken. Please choose another.');
          return;
        }
        setError(profileErr.message);
        return;
      }
      router.push('/login');
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-700">Sign Up</h2>
      <form onSubmit={handleSignup} className="w-full max-w-sm flex flex-col gap-4">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-gray-700 bg-white"
        />
        <input
          type="text"
          placeholder="Full name (optional)"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-gray-700 bg-white"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="border border-gray-300 rounded px-3 py-2 text-gray-700 bg-white"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="border border-gray-300 rounded px-3 py-2 text-gray-700 bg-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="border border-gray-300 rounded px-3 py-2 text-gray-500 bg-white hover:border-orange-300 transition"
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </form>
      <div className="mt-6 text-sm text-gray-500">
        Already have an account?{" "}
        <a href="/login" className="underline hover:text-gray-700">
          Log In
        </a>
      </div>
    </div>
  );
}
