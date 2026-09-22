import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updatePost } from "@/app/posts/actions";
import PostForm from "@/components/PostForm";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?redirectedFrom=/posts/${slug}/edit`);

  const { data: post, error } = await supabase
    .from("posts")
    .select("id, title, content, image_url, user_id, category_id")
    .eq("slug", slug)
    .single();

  if (error || !post) notFound();

  // Only the author may reach the edit page — everyone else is bounced home.
  if (post.user_id !== user.id) redirect("/");

  const [{ data: categories }, { data: images }] = await Promise.all([
    supabase.from("categories").select("id, name, slug").order("name"),
    supabase
      .from("post_images")
      .select("id, image_url")
      .eq("post_id", post.id)
      .order("position"),
  ]);

  const boundUpdate = updatePost.bind(null, post.id, slug);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Edit post</h1>
      <PostForm
        action={boundUpdate}
        initial={{
          title: post.title,
          content: post.content,
          image_url: post.image_url,
          category_id: post.category_id,
        }}
        submitLabel="Save changes"
        categories={categories ?? []}
        existingImages={images ?? []}
        postSlug={slug}
      />
    </div>
  );
}
