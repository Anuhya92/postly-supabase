import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (categoryError || !category) notFound();

  const { data: posts, error } = await supabase
    .from("posts")
    .select("slug, title, content, image_url, created_at")
    .eq("category_id", category.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-gray-500">Category</p>
        <h1 className="text-2xl font-bold">{category.name}</h1>
      </div>

      {error && <p className="form-error">Could not load posts: {error.message}</p>}

      {!error && posts?.length === 0 && (
        <p className="text-gray-500">No posts in this category yet.</p>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts?.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
