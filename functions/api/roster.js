/**
 * Roster API Endpoint
 * Handles GET (fetch all players), POST (update player EP/GP), PUT (create/update)
 */

// Ensure the roster table exists
async function ensureRosterTableExists(env) {
  try {
    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS roster (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player TEXT NOT NULL UNIQUE,
        ep REAL DEFAULT 0,
        gp REAL DEFAULT 2,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ).run();

    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_roster_player ON roster(player)`).run();
  } catch (error) {
    console.error('Error ensuring roster table exists:', error);
  }
}

// Helper function for CORS headers
function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

// GET /api/roster - Fetch all roster players with EP/GP
async function handleGet(env) {
  try {
    await ensureRosterTableExists(env);

    const result = await env.DB.prepare(
      `SELECT id, player, ep, gp, ROUND(CAST(ep AS FLOAT) / NULLIF(gp, 0), 2) as pr, created_at, updated_at
       FROM roster
       ORDER BY pr DESC, player ASC`
    ).all();

    return new Response(JSON.stringify({
      success: true,
      count: result.results.length,
      data: result.results
    }), {
      status: 200,
      headers: corsHeaders()
    });
  } catch (error) {
    console.error('GET error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

// POST /api/roster - Update player EP/GP
async function handlePost(env, request) {
  try {
    await ensureRosterTableExists(env);

    const { player, ep, gp } = await request.json();

    if (!player) {
      return new Response(JSON.stringify({ error: 'Player name is required' }), {
        status: 400,
        headers: corsHeaders()
      });
    }

    // Insert or update roster entry
    const result = await env.DB.prepare(
      `INSERT INTO roster (player, ep, gp, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(player) DO UPDATE SET
       ep = EXCLUDED.ep,
       gp = EXCLUDED.gp,
       updated_at = CURRENT_TIMESTAMP`
    ).bind(
      player,
      ep ?? 0,
      gp ?? 2
    ).run();

    return new Response(JSON.stringify({
      success: true,
      message: `Updated ${player}`
    }), {
      status: 200,
      headers: corsHeaders()
    });
  } catch (error) {
    console.error('POST error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

// PUT /api/roster - Bulk update or create roster entries
async function handlePut(env, request) {
  try {
    await ensureRosterTableExists(env);

    const { players } = await request.json();

    if (!Array.isArray(players)) {
      return new Response(JSON.stringify({ error: 'Expected array of players' }), {
        status: 400,
        headers: corsHeaders()
      });
    }

    let updated = 0;
    for (const { player, ep, gp } of players) {
      if (!player) continue;

      await env.DB.prepare(
        `INSERT INTO roster (player, ep, gp, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(player) DO UPDATE SET
         ep = EXCLUDED.ep,
         gp = EXCLUDED.gp,
         updated_at = CURRENT_TIMESTAMP`
      ).bind(
        player,
        ep ?? 0,
        gp ?? 2
      ).run();
      updated++;
    }

    return new Response(JSON.stringify({
      success: true,
      updated: updated
    }), {
      status: 200,
      headers: corsHeaders()
    });
  } catch (error) {
    console.error('PUT error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

// DELETE /api/roster - Delete a player or clear all
async function handleDelete(env, request) {
  try {
    await ensureRosterTableExists(env);

    const url = new URL(request.url);
    const player = url.searchParams.get('player');

    if (player) {
      // Delete specific player
      await env.DB.prepare(`DELETE FROM roster WHERE player = ?`).bind(player).run();
      return new Response(JSON.stringify({
        success: true,
        message: `Deleted ${player}`
      }), {
        status: 200,
        headers: corsHeaders()
      });
    } else {
      // Delete all
      await env.DB.prepare(`DELETE FROM roster`).run();
      return new Response(JSON.stringify({
        success: true,
        message: 'Deleted all roster entries'
      }), {
        status: 200,
        headers: corsHeaders()
      });
    }
  } catch (error) {
    console.error('DELETE error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

// Main request handler
export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders()
    });
  }

  const { request, env } = context;

  try {
    if (request.method === 'GET') {
      return await handleGet(env);
    } else if (request.method === 'POST') {
      return await handlePost(env, request);
    } else if (request.method === 'PUT') {
      return await handlePut(env, request);
    } else if (request.method === 'DELETE') {
      return await handleDelete(env, request);
    } else {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: corsHeaders()
      });
    }
  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: corsHeaders()
      }
    );
  }
}
