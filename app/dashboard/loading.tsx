import { IdeaCardSkeleton } from "../components/Skeleton";

export default function LoadingDashboard() {
  return (
    <div className="min-h-screen bg-white font-sans flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-xl flex justify-between items-center mb-4 opacity-60">
        <div className="h-9 w-40 bg-gray-200 rounded" />
        <div className="flex gap-3">
          <div className="h-9 w-24 bg-gray-200 rounded" />
          <div className="h-9 w-24 bg-gray-200 rounded" />
          <div className="h-9 w-24 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="h-7 w-40 bg-gray-200 rounded mb-6" />
      <div className="h-10 w-full max-w-xl bg-gray-200 rounded mb-6" />
      <div className="w-full max-w-xl flex flex-col gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <IdeaCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

