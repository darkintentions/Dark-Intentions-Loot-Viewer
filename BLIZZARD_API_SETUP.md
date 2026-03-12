# Blizzard API Setup Guide

This project now integrates with Blizzard's official World of Warcraft API for reliable item data fetching.

## Setup Steps

### 1. Register at Blizzard Developer Portal

1. Visit https://developer.battle.net/
2. Click "Create API Application"
3. Fill in the application details:
   - **Name**: DI EPPG Loot Viewer (or your preferred name)
   - **Description**: WoW item data fetching
   - **Redirect URLs**: Leave blank (we don't use OAuth login, only client credentials)

### 2. Get Your Credentials

After creating the application, you'll see:
- **Client ID** - Copy this
- **Client Secret** - Copy this (keep this secret!)

### 3. Local Development Setup

Create a `.env.local` file in the project root:

```
BLIZZARD_CLIENT_ID=your_client_id_here
BLIZZARD_CLIENT_SECRET=your_client_secret_here
```

**DO NOT commit this file to git!** It should already be in .gitignore.

### 4. Run the Dev Server

```bash
npx wrangler pages dev
```

The server will read the environment variables from `.env.local`.

### 5. Test It

Open http://127.0.0.1:8788 in your browser:
1. Go to the EPGP tab
2. In "Add Gear Points", enter an Item ID (e.g., `251168`)
3. Open Browser Console (F12)
4. Look for logs starting with `[Blizzard API]` or `[Wowhead]`

The system will:
- Try Blizzard API first (official, reliable)
- Fall back to Wowhead scraping if Blizzard fails
- Cache results to avoid repeated requests

## How It Works

### Blizzard API Endpoint Flow

```
Frontend (Add Gear Points)
    ↓
POST /api/blizzard/{itemId}
    ↓
Backend (blizzard.js)
    ├─ Get OAuth2 token from Blizzard
    ├─ Fetch item data from Blizzard API
    └─ Return item details (name, armor type, slot, etc.)
    ↓
Cache result
    ↓
Display item info to user
```

### Fallback to Wowhead

If Blizzard API:
- Returns 404 (item not found)
- Fails authentication
- Returns an error

The system automatically falls back to scraping Wowhead.com for the data.

## Returned Item Data

From Blizzard API, you get:
- `itemName` - Official item name
- `itemClass` - Weapon, Armor, Accessory, etc.
- `itemSubClass` - Armor type (Leather, Mail, Plate, Cloth, etc.)
- `inventoryType` - Gear slot (Head, Chest, Legs, etc.)
- `quality` - Common, Uncommon, Rare, Epic, Legendary
- `armor` - Armor value
- `requiredLevel` - Minimum level requirement
- `bindingType` - Bind on Pickup, Bind on Equip, etc.

## Production Deployment

For Cloudflare Pages deployment:

1. Go to your Cloudflare dashboard
2. Navigate to Pages → Your Project → Settings
3. Add environment variables:
   - `BLIZZARD_CLIENT_ID`: Your client ID
   - `BLIZZARD_CLIENT_SECRET`: Your client secret

**Never expose your Client Secret in git or logs!**

## Troubleshooting

### "Blizzard API credentials not configured"
- Check `.env.local` exists and has correct values
- Restart the dev server after creating `.env.local`

### "Blizzard auth failed"
- Verify Client ID and Secret are correct
- Check the credentials haven't expired in Blizzard Developer Portal

### Item returns 404 from Blizzard
- The item may not exist in the current WoW database
- System falls back to Wowhead automatically

### Console shows "[Wowhead] Fallback scrape..."
- This is normal - Blizzard API failed or wasn't available
- Wowhead scraping is the failover mechanism

## Rate Limiting

Blizzard API has rate limits:
- Authenticated requests: Higher limits (depends on your Blizzard tier)
- Requests are cached to minimize API calls

Wowhead has no official rate limit but practice reasonable request rates.

## Additional Resources

- [Blizzard Developer Portal](https://developer.battle.net/)
- [WoW Game Data API Docs](https://community.developer.battle.net/documentation/world-of-warcraft/game-data-apis)
- [Getting Started with WoW API](https://us.forums.blizzard.com/en/blizzard/t/getting-started-with-the-wow-api/12097)
