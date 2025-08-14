"use client";
import { useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.replace("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-700">Log In</h2>
      <form onSubmit={handleLogin} className="w-full max-w-sm flex flex-col gap-4">
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
          {loading ? "Logging in..." : "Log In"}
        </button>
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </form>
      <div className="mt-6 text-sm text-gray-500">
        Need an account?{' '}
        <a href="/signup" className="underline hover:text-gray-700">Sign Up</a>
      </div>
    </div>
  );
}
