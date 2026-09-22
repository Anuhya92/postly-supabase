"use client";

import { useFormState, useFormStatus } from "react-dom";
import Image from "next/image";
import { useState, useTransition } from "react";
import { deletePostImage } from "@/app/posts/actions";

type ActionResult = { error: string } | { success: true; slug?: string } | null;
type Action = (
  prevState: ActionResult,
  formData: FormData
) => Promise<ActionResult>;

type Category = { id: string; name: string; slug: string };
type ExistingImage = { id: string; image_url: string };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Saving…" : label}
    </button>
  );
}

function ExistingImageThumb({
  image,
  postSlug,
}: {
  image: ExistingImage;
  postSlug: string;
}) {
  const [removed, setRemoved] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (removed) return null;

  return (
    <div className="relative aspect-square w-24 overflow-hidden rounded-lg border">
      <Image src={image.image_url} alt="" fill className="object-cover" />
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await deletePostImage(image.id, postSlug);
            if (!result || !("error" in result)) setRemoved(true);
          })
        }
        className="absolute right-1 top-1 rounded-full bg-white/90 px-1.5 text-xs font-medium text-red-600 shadow"
      >
        ×
      </button>
    </div>
  );
}

export default function PostForm({
  action,
  initial,
  submitLabel,
  categories,
  existingImages,
  postSlug,
}: {
  action: Action;
  initial?: {
    title: string;
    content: string;
    image_url: string | null;
    category_id: string | null;
  };
  submitLabel: string;
  categories: Category[];
  existingImages?: ExistingImage[];
  postSlug?: string;
}) {
  const [state, formAction] = useFormState<ActionResult, FormData>(action, null);
  const [previews, setPreviews] = useState<string[]>([]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state && "error" in state && <p className="form-error">{state.error}</p>}

      <div>
        <label className="mb-1 block text-sm font-medium">Title</label>
        <input
          name="title"
          required
          defaultValue={initial?.title}
          className="input"
          placeholder="An interesting title"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Category</label>
        <select
          name="category_id"
          defaultValue={initial?.category_id ?? ""}
          className="input"
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Content</label>
        <textarea
          name="content"
          required
          rows={10}
          defaultValue={initial?.content}
          className="input"
          placeholder="Write your post…"
        />
      </div>

      {existingImages && existingImages.length > 0 && postSlug && (
        <div>
          <label className="mb-1 block text-sm font-medium">Current images</label>
          <div className="flex flex-wrap gap-2">
            {existingImages.map((img) => (
              <ExistingImageThumb key={img.id} image={img} postSlug={postSlug} />
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">
          {existingImages ? "Add more images" : "Images"}
        </label>
        <input
          name="images"
          type="file"
          accept="image/*"
          multiple
          className="input"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            setPreviews(files.map((f) => URL.createObjectURL(f)));
          }}
        />
        {previews.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {previews.map((src, i) => (
              <div
                key={i}
                className="relative aspect-square w-24 overflow-hidden rounded-lg border"
              >
                <Image src={src} alt="" fill className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      <SubmitButton label={submitLabel} />
    </form>
  );
}
