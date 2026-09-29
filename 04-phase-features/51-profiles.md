# 51 — Multiple Profiles ("Who's watching?")

## DB (Supabase, RLS: user owns rows)
`profiles(id uuid pk, user_id fk, name text, avatar text, is_kids bool, language text, created_at)` — max 5 per user.

## Profile picker `/profiles`
- Full-screen, centered avatars (illustrated original characters — do not use copyrighted characters).
- Avatars float gently (L3); hover: scale + glow + name weight animates; others dim.
- Select: chosen avatar zooms toward camera and screen fades into home (L1 moment).
- "Manage profiles" mode: avatars wiggle, edit pencil pops in.
- Kids profile → filter `certification.lte=U/A` and exclude horror/adult via discover params.

## Acceptance
- [ ] RLS tested: user A cannot read user B profiles
- [ ] Kids filter applied to every data call
