import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import SearchBar from "@/components/SearchBar";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-semibold text-indigo-600">
            Postly
          </Link>
          <div className="flex items-center gap-2 sm:hidden">
            {user ? (
              <LogoutButton />
            ) : (
              <Link href="/login" className="btn-primary">
                Log in
              </Link>
            )}
          </div>
        </div>

        <div className="w-full sm:max-w-xs">
          <SearchBar />
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <Link href="/posts/create" className="btn-secondary">
            + New post
          </Link>
          {user ? (
            <>
              <span className="text-sm text-gray-500 truncate max-w-[140px]">
                {user.email}
              </span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="btn-secondary">
                Log in
              </Link>
              <Link href="/register" className="btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
