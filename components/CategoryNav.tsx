import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function CategoryNav() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("name, slug")
    .order("name");

  if (!categories || categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/categories/${c.slug}`}
          className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}
