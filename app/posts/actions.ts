"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type ActionResult = { error: string } | { success: true; slug?: string };

function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Date.now().toString(36)
  );
}

async function uploadImages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  files: File[]
): Promise<{ urls: string[]; error?: string }> {
  const urls: string[] = [];

  for (const file of files) {
    if (!file || file.size === 0) continue;

    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
    const { error } = await supabase.storage
      .from("post-images")
      .upload(path, file, { upsert: true });

    if (error) return { urls, error: `Image upload failed: ${error.message}` };

    const { data } = supabase.storage.from("post-images").getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return { urls };
}

export async function createPost(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to create a post." };

  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const categoryId = (formData.get("category_id") as string) || null;
  const imageFiles = formData.getAll("images") as File[];

  if (!title || !content) {
    return { error: "Title and content are required." };
  }

  const { urls, error: uploadError } = await uploadImages(supabase, user.id, imageFiles);
  if (uploadError) return { error: uploadError };

  const slug = slugify(title);

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      title,
      content,
      slug,
      image_url: urls[0] ?? null,
      category_id: categoryId,
      user_id: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: `Could not create post: ${error.message}` };

  if (urls.length > 0) {
    const rows = urls.map((image_url, position) => ({
      post_id: post.id,
      image_url,
      position,
    }));
    await supabase.from("post_images").insert(rows);
  }

  revalidatePath("/");
  redirect(`/posts/${slug}`);
}

export async function updatePost(
  postId: string,
  currentSlug: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const categoryId = (formData.get("category_id") as string) || null;
  const imageFiles = formData.getAll("images") as File[];

  if (!title || !content) {
    return { error: "Title and content are required." };
  }

  const { urls, error: uploadError } = await uploadImages(supabase, user.id, imageFiles);
  if (uploadError) return { error: uploadError };

  const update: Record<string, unknown> = { title, content, category_id: categoryId };
  if (urls.length > 0) update.image_url = urls[0];

  const { error } = await supabase
    .from("posts")
    .update(update)
    .eq("id", postId)
    .eq("user_id", user.id);

  if (error) return { error: `Could not update post: ${error.message}` };

  if (urls.length > 0) {
    const { count } = await supabase
      .from("post_images")
      .select("id", { count: "exact", head: true })
      .eq("post_id", postId);

    const rows = urls.map((image_url, i) => ({
      post_id: postId,
      image_url,
      position: (count ?? 0) + i,
    }));
    await supabase.from("post_images").insert(rows);
  }

  revalidatePath("/");
  revalidatePath(`/posts/${currentSlug}`);
  redirect(`/posts/${currentSlug}`);
}

export async function deletePostImage(
  imageId: string,
  postSlug: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { error } = await supabase.from("post_images").delete().eq("id", imageId);
  if (error) return { error: `Could not remove image: ${error.message}` };

  revalidatePath(`/posts/${postSlug}`);
  return { success: true };
}

export async function deletePost(postId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", user.id);

  if (error) return { error: `Could not delete post: ${error.message}` };

  revalidatePath("/");
  redirect("/");
}
