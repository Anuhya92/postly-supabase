import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";
import CategoryNav from "@/components/CategoryNav";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("slug, title, content, image_url, created_at")
    .order("created_at", { ascending: false });

  if (q) query = query.ilike("title", `%${q}%`);

  const { data: posts, error } = await query;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {q ? `Results for “${q}”` : "Latest posts"}
        </h1>
      </div>

      <CategoryNav />

      {error && (
        <p className="form-error">Could not load posts: {error.message}</p>
      )}

      {!error && posts?.length === 0 && (
        <p className="text-gray-500">
          {q ? "No posts match your search." : "No posts yet — be the first to write one."}
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts?.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
