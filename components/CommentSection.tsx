"use client";

import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { addComment, deleteComment } from "@/app/comments/actions";

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  author_email: string | null;
};

type CommentNode = Comment & { replies: CommentNode[] };

type ActionResult = { error: string } | { success: true } | null;

function buildTree(comments: Comment[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  comments.forEach((c) => map.set(c.id, { ...c, replies: [] }));

  const roots: CommentNode[] = [];
  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.replies.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Posting…" : label}
    </button>
  );
}

function ReplyForm({
  postId,
  postSlug,
  parentId,
  onDone,
}: {
  postId: string;
  postSlug: string;
  parentId: string;
  onDone: () => void;
}) {
  const boundAdd = addComment.bind(null, postId, postSlug, parentId);
  const [state, formAction] = useFormState<ActionResult, FormData>(boundAdd, null);

  return (
    <form
      action={(fd) => {
        formAction(fd);
        onDone();
      }}
      className="mt-2 flex flex-col gap-2"
    >
      {state && "error" in state && <p className="form-error">{state.error}</p>}
      <textarea
        name="content"
        required
        rows={2}
        className="input"
        placeholder="Write a reply…"
        autoFocus
      />
      <div>
        <SubmitButton label="Reply" />
      </div>
    </form>
  );
}

function CommentItem({
  node,
  postId,
  postSlug,
  currentUserId,
  postAuthorId,
  depth,
}: {
  node: CommentNode;
  postId: string;
  postSlug: string;
  currentUserId: string | null;
  postAuthorId: string;
  depth: number;
}) {
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canDelete = currentUserId === node.user_id || currentUserId === postAuthorId;

  function handleDelete() {
    if (!confirm("Delete this comment?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteComment(node.id, postSlug);
      if (result && "error" in result) setError(result.error);
    });
  }

  return (
    <li
      className="rounded-lg bg-gray-50 p-3"
      style={{ marginLeft: depth > 0 ? 20 : 0 }}
    >
      <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
        <span>{node.author_email ?? "Unknown user"}</span>
        <span>{new Date(node.created_at).toLocaleString("en-US", { timeZone: "UTC" })}</span>
      </div>
      <p className="text-sm text-gray-800">{node.content}</p>

      <div className="mt-2 flex items-center gap-3">
        {currentUserId && (
          <button
            onClick={() => setReplying((r) => !r)}
            className="text-xs text-indigo-600 hover:underline"
          >
            {replying ? "Cancel" : "Reply"}
          </button>
        )}
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-xs text-red-600 hover:underline"
          >
            {isPending ? "Deleting…" : "Delete"}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {replying && currentUserId && (
        <ReplyForm
          postId={postId}
          postSlug={postSlug}
          parentId={node.id}
          onDone={() => setReplying(false)}
        />
      )}

      {node.replies.length > 0 && (
        <ul className="mt-3 flex flex-col gap-3 border-l-2 border-gray-200 pl-3">
          {node.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              node={reply}
              postId={postId}
              postSlug={postSlug}
              currentUserId={currentUserId}
              postAuthorId={postAuthorId}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function CommentSection({
  postId,
  postSlug,
  comments,
  currentUserId,
  postAuthorId,
}: {
  postId: string;
  postSlug: string;
  comments: Comment[];
  currentUserId: string | null;
  postAuthorId: string;
}) {
  const boundAdd = addComment.bind(null, postId, postSlug, null);
  const [state, formAction] = useFormState<ActionResult, FormData>(boundAdd, null);
  const tree = buildTree(comments);

  return (
    <section className="mt-10 border-t border-gray-200 pt-6">
      <h2 className="mb-4 text-lg font-semibold">Comments ({comments.length})</h2>

      {currentUserId ? (
        <form action={formAction} className="mb-6 flex flex-col gap-2">
          {state && "error" in state && <p className="form-error">{state.error}</p>}
          <textarea
            name="content"
            required
            rows={3}
            className="input"
            placeholder="Add a comment…"
          />
          <div>
            <SubmitButton label="Post comment" />
          </div>
        </form>
      ) : (
        <p className="mb-6 text-sm text-gray-500">Log in to leave a comment.</p>
      )}

      <ul className="flex flex-col gap-4">
        {tree.map((node) => (
          <CommentItem
            key={node.id}
            node={node}
            postId={postId}
            postSlug={postSlug}
            currentUserId={currentUserId}
            postAuthorId={postAuthorId}
            depth={0}
          />
        ))}
        {tree.length === 0 && <li className="text-sm text-gray-400">No comments yet.</li>}
      </ul>
    </section>
  );
}
