# Postly — Fullstack Blog (Next.js + Supabase)

A blog application built to practice relational databases, authentication,
and CRUD operations using Next.js and Supabase.

## Tech stack

- **Next.js** (App Router) — frontend + server logic
- **Supabase** — Postgres database, Authentication, and Storage
- **Tailwind CSS** — responsive styling

## How each requirement is met

**Authentication**

- Register, login, and logout powered by Supabase Auth
- The "create post" and "edit post" pages redirect unauthenticated users to login (enforced in `middleware.ts`)

**Database & relational data**

- `users` — managed by Supabase Auth, mirrored into a `profiles` table
- `posts` — belongs to one user (one-to-many: user → posts)
- `comments` — belongs to a user and a post (one-to-many from both sides), with a `parent_id` for threaded replies
- `categories` — each post belongs to one category (one-to-many: category → posts)

**Images**

- Users can attach multiple images to a post and edit/remove them individually, stored in Supabase Storage

**CRUD on posts**

- Anyone can read posts
- Only the logged-in author can create, edit, or delete their own post — enforced with Postgres Row Level Security (RLS), not just frontend checks

**Comments**

- Anyone can read comments
- Logged-in users can add and delete their own comments, and can reply to any comment (nested threads)
- A post's author can also delete comments on their own post

**Search**

- Posts can be searched by title from the homepage

**Data fetching & errors**

- Pages fetch data on the server and revalidate automatically after a create/update/delete
- Failed actions show an inline error message to the user instead of failing silently

**Responsive design**

- Built mobile-first with Tailwind CSS

## Setup (for running locally)

1. `npm install`
2. Add Supabase project URL + anon key to `.env.local`
3. Run `supabase/schema.sql`, then `supabase/migration_v2.sql`, in the Supabase SQL editor
4. `npm run dev`
