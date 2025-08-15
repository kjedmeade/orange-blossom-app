"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans flex flex-col items-center justify-center px-4 py-8 sm:py-16">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-widest text-gray-900 mb-6">
          ORANGE BLOSSOM
        </h1>
        <p className="text-lg text-gray-500 mb-10">Your self care companion</p>
        <div className="flex flex-col items-center gap-4 pt-2">
          <a
            href="/login"
            className="border border-gray-300 rounded px-6 py-3 text-gray-500 hover:border-orange-300 transition font-semibold text-base"
          >
            Start building your self care dictionary
          </a>
        </div>
      </header>
    </div>
  );
}
