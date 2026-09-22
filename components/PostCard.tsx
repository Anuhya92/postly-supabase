import Link from "next/link";
import Image from "next/image";

type Post = {
  slug: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
};

export default function PostCard({ post }: { post: Post }) {
  const excerpt =
    post.content.length > 120 ? post.content.slice(0, 120) + "…" : post.content;

  return (
    <Link href={`/posts/${post.slug}`} className="card flex flex-col overflow-hidden">
      <div className="relative aspect-[16/9] w-full bg-gray-100">
        {post.image_url ? (
          <Image
            src={post.image_url}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 33vw, 100vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="line-clamp-2 font-semibold text-gray-900">{post.title}</h2>
        <p className="line-clamp-3 text-sm text-gray-500">{excerpt}</p>
        <time className="mt-auto pt-2 text-xs text-gray-400">
          {new Date(post.created_at).toLocaleDateString("en-US", { timeZone: "UTC" })}
        </time>
      </div>
    </Link>
  );
}
