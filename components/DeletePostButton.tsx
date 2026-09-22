"use client";

import { useState, useTransition } from "react";
import { deletePost } from "@/app/posts/actions";

export default function DeletePostButton({ postId }: { postId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deletePost(postId);
      if (result && "error" in result) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={handleClick} disabled={isPending} className="btn-danger">
        {isPending ? "Deleting…" : "Delete"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
