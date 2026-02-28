import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="rounded-lg bg-white p-8 shadow-sm border border-slate-200 max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold mb-2">IdeaApp Merchant Portal</h1>
        <p className="text-sm text-slate-600 mb-6">Sign in to manage orders and sync requests.</p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-md bg-slate-900 text-white px-4 py-2 text-sm font-medium"
        >
          Go to Login
        </Link>
      </div>
    </main>
  );
}
