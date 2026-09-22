"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ActionResult = { error: string } | { success: true };

export async function addComment(
  postId: string,
  postSlug: string,
  parentId: string | null,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to comment." };

  const content = (formData.get("content") as string)?.trim();
  if (!content) return { error: "Comment cannot be empty." };

  const { error } = await supabase
    .from("comments")
    .insert({ post_id: postId, user_id: user.id, content, parent_id: parentId });

  if (error) return { error: `Could not post comment: ${error.message}` };

  revalidatePath(`/posts/${postSlug}`);
  return { success: true };
}

export async function deleteComment(
  commentId: string,
  postSlug: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  // RLS allows this for the comment's author OR the post's author.
  // Deleting a parent comment cascades to its replies (parent_id FK on delete cascade).
  const { error } = await supabase.from("comments").delete().eq("id", commentId);

  if (error) return { error: `Could not delete comment: ${error.message}` };

  revalidatePath(`/posts/${postSlug}`);
  return { success: true };
}
