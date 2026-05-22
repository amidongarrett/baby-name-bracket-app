# Admin Panel — System Interactions

```mermaid
sequenceDiagram
    participant Admin as Owner 1 (browser)
    participant Navbar as Navbar.jsx
    participant API as POST /api/admin/*
    participant DB as MongoDB Bracket doc

    Admin->>Navbar: clicks Danger Zone action
    Navbar->>Admin: shows ConfirmModal
    Admin->>Navbar: confirms
    Navbar->>API: POST with { bracketId }
    API->>DB: mutate bracket fields
    DB-->>API: saved
    API-->>Navbar: { success: true, ... }
    Navbar->>Admin: window.location.reload()
```

## Danger Zone actions and their API routes

| Button | Visible when | API endpoint | Fields mutated |
|--------|-------------|--------------|----------------|
| Unlock Names | `status !== 'draft'` | `POST /api/admin/unlock-names` | clears votes + matchups, status → draft, lock-in flags → false |
| Unlock Lock-In | `owner1LockedIn \|\| owner2LockedIn` | `POST /api/admin/unlock-lockin` | lock-in flags → false, matchup stubs cleared, status → draft |
| Remove Owner 2 | always | `DELETE /bracket/:id/owner2` | removes owner2 association |
| Delete Bracket | always | `DELETE /bracket/:id` | removes bracket document |
