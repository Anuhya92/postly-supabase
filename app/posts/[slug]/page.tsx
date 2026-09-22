import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CommentSection from "@/components/CommentSection";
import DeletePostButton from "@/components/DeletePostButton";

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: post, error } = await supabase
    .from("posts")
    .select(
      "id, title, content, image_url, created_at, user_id, profiles(email), categories(name, slug)"
    )
    .eq("slug", slug)
    .single();

  if (error || !post) notFound();

  const [{ data: rawComments }, { data: images }] = await Promise.all([
    supabase
      .from("comments")
      .select("id, content, created_at, user_id, parent_id, profiles(email)")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("post_images")
      .select("id, image_url")
      .eq("post_id", post.id)
      .order("position"),
  ]);

  const comments = (rawComments ?? []).map((c) => ({
    id: c.id,
    content: c.content,
    created_at: c.created_at,
    user_id: c.user_id,
    parent_id: c.parent_id,
    author_email: (c.profiles as unknown as { email: string } | null)?.email ?? null,
  }));

  const isOwner = user?.id === post.user_id;
  const authorEmail =
    (post.profiles as unknown as { email: string } | null)?.email ?? "Unknown author";
  const category = post.categories as unknown as { name: string; slug: string } | null;
  const gallery = images ?? [];

  return (
    <article className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to all posts
        </Link>
        {isOwner && (
          <div className="flex gap-2">
            <Link href={`/posts/${slug}/edit`} className="btn-secondary">
              Edit
            </Link>
            <DeletePostButton postId={post.id} />
          </div>
        )}
      </div>

      {post.image_url && (
        <div className="relative mb-3 aspect-[16/9] w-full overflow-hidden rounded-xl">
          <Image src={post.image_url} alt={post.title} fill className="object-cover" />
        </div>
      )}

      {gallery.length > 1 && (
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {gallery.map((img) => (
            <div
              key={img.id}
              className="relative aspect-square w-20 flex-shrink-0 overflow-hidden rounded-lg border"
            >
              <Image src={img.image_url} alt="" fill className="object-cover" />
            </div>
          ))}
        </div>
      )}

      {category && (
        <Link
          href={`/categories/${category.slug}`}
          className="mb-2 inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600"
        >
          {category.name}
        </Link>
      )}

      <h1 className="mb-2 text-3xl font-bold">{post.title}</h1>
      <p className="mb-6 text-sm text-gray-500">
        by {authorEmail} ·{" "}
        {new Date(post.created_at).toLocaleDateString("en-US", { timeZone: "UTC" })}
      </p>

      <div className="prose max-w-none whitespace-pre-wrap text-gray-800">
        {post.content}
      </div>

      <CommentSection
        postId={post.id}
        postSlug={slug}
        comments={comments}
        currentUserId={user?.id ?? null}
        postAuthorId={post.user_id}
      />
    </article>
  );
}
