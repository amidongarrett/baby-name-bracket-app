# Admin Panel

The admin panel is accessible to Owner 1 (the bracket creator) through the Navbar. It surfaces a "Danger Zone" section containing administrative actions that affect the bracket's lifecycle state — things an ordinary participant cannot do.

The admin panel is rendered entirely within `components/layout/Navbar.jsx`. Each action in the Danger Zone is guarded by a `ConfirmModal` before the mutation fires.

## Inner features

- **unlock-lockin** — Resets both owners' lock-in flags so names can be adjusted and re-submitted, without touching name lists or votes.
