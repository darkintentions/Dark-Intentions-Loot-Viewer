# D1 Database Setup Guide

## Step 1: Create the Database Table

Run this command to initialize your D1 database with the required table:

```bash
wrangler d1 execute loot-epgp --file schema.sql
```

## Step 2: Local Development

To test locally with D1 integration:

```bash
wrangler pages dev . --d1=DB=loot-epgp
```

This will:
- Start your site locally at `http://localhost:8787`
- Connect to D1 via the `DB` binding
- Create a local SQLite database for testing (persisted in `.wrangler/state/`)

## Step 3: Update Existing Data

If you have existing data in IndexedDB, you'll need to export it and re-import it:

1. Open your site in the browser
2. Open Browser DevTools (F12)
3. Go to Application → IndexedDB → TSVViewerDB → rows
4. Right-click and export the data
5. Format the data as JSON and import it through the UI

Or you can manually add data via the TSV import in the site.

## Step 4: Deploy to Cloudflare Pages

```bash
wrangler pages deploy
```

This will:
- Deploy your site to Cloudflare Pages
- Connect to your D1 database
- Make the API endpoints available at `/api/loot`

## API Endpoints

Your Pages Functions are now available at:

- **GET /api/loot** - Fetch all loot records
- **POST /api/loot** - Add new loot records (JSON body with `rows` array)
- **DELETE /api/loot** - Clear all loot records

## Database Schema

The database has a single `loot` table with these columns:

```sql
id                INTEGER PRIMARY KEY
player            TEXT NOT NULL
item              TEXT NOT NULL
boss              TEXT
response          TEXT
date              TEXT
armor_type        TEXT
gear_slot         TEXT
created_at        DATETIME (auto-set)
```

Unique constraint on: (player, item, boss, response, date)

## Testing the API

```bash
# Get all records
curl https://your-site.pages.dev/api/loot

# Add records
curl -X POST https://your-site.pages.dev/api/loot \
  -H "Content-Type: application/json" \
  -d '{
    "rows": [
      {
        "player": "PlayerName",
        "item": "Item Name",
        "boss": "Boss Name",
        "response": "Need",
        "date": "2025-03-10"
      }
    ]
  }'

# Clear all records
curl -X DELETE https://your-site.pages.dev/api/loot
```

## Troubleshooting

### "Database not found" error
- Make sure you've run `wrangler d1 execute` to create the table
- Check that database_id in wrangler.jsonc matches your actual database ID

### API returns 500 errors
- Check the Pages deployment logs in Cloudflare dashboard
- Run locally with `wrangler pages dev` to see detailed errors
- Verify your database binding is correct in wrangler.jsonc

### Data not persisting
- In local dev: Check `.wrangler/state/` for the local database file
- In production: Verify the D1 database is linked correctly in the dashboard
- Check that the API response shows `"success": true`
