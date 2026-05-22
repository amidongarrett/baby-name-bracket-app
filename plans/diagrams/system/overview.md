# App-Wide System Diagram

This diagram shows the top-level service boundaries and cross-service call groups registered in the app.

```mermaid
graph TD
    FE["Frontend (Next.js)\nbaby-name-bracket-app"]
    API["Backend API (Express)\nbaby-name-bracket-api"]
    DB[("MongoDB\nBracket / UserBracket / User")]

    FE -->|"REST /api/*"| API
    API --> DB

    subgraph "API Route Groups"
        R1["/bracket/* — bracket lifecycle"]
        R2["/admin/* — owner-1 admin actions"]
        R3["/brackets/:id/names — name management"]
        R4["/auth/* — authentication"]
    end

    API --> R1
    API --> R2
    API --> R3
    API --> R4
```

## Registered admin endpoints (no auth middleware at router level)

| Method | Path | Controller |
|--------|------|------------|
| POST | `/api/admin/set-winner` | `setMatchupWinner` |
| POST | `/api/admin/publish-round` | `publishRound` |
| POST | `/api/admin/reset-and-regenerate` | `resetAndRegenerate` |
| POST | `/api/admin/unlock-names` | `unlockNames` |
| POST | `/api/admin/unlock-lockin` | `unlockLockin` |
