# Keep CEDIGAIN data after every Render redeploy

Render **rebuilds the container** on each deploy. Anything stored only inside the image or `/app` is wiped.

CEDIGAIN stores:

- SQLite database → must live on a **persistent disk**
- Uploaded images → same disk

## Required Render setup

### 1. Plan
Use **Starter** (or any paid plan with disks). **Free plan cannot keep SQLite data.**

### 2. Persistent disk (same web service)

| Setting | Value |
|---------|--------|
| Name | `cedigain-persistent-data` |
| Mount path | `/var/data` |
| Size | 1–2 GB+ |

Do **not** change the mount path after live data exists.

### 3. Environment variables

| Key | Value |
|-----|--------|
| `DATABASE_URL` | `sqlite:////var/data/cedigain.db` |
| `UPLOAD_DIR` | `/var/data/uploads` |
| `PERSIST_ROOT` | `/var/data` |
| `SECRET_KEY` | Long random secret (generate once, never rotate casually) |
| `ADMIN_PHONE` | Your admin login phone |
| `ADMIN_PASSWORD` | Strong password |
| `ALLOWED_ORIGINS` | Your live origin, e.g. `https://cedigain.com` |

### 4. Verify after deploy

Open:

```
https://YOUR-SERVICE.onrender.com/api/health
```

You should see:

```json
{
  "status": "ok",
  "persistent": true,
  "database_url_host": "/var/data"
}
```

If `"persistent": false`, the disk is not mounted or `DATABASE_URL` still points at ephemeral storage.

## Blueprint

`render.yaml` already includes the disk and env defaults. Prefer **New → Blueprint** from this repo.

## What the app does automatically

- Creates `/var/data` and upload folders when possible
- Defaults SQLite to `/var/data/cedigain.db` when the disk is present
- On container start, copies an old `/app/cedigain.db` onto the disk **once** if the disk DB is missing (migration aid only)

## Optional: PostgreSQL

For larger production load, attach Render Postgres and set:

```
DATABASE_URL=postgresql+psycopg://USER:PASS@HOST/DB
```

SQLite on a disk is enough for typical single-instance CEDIGAIN deployments.
