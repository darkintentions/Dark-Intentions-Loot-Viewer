/**
 * GP (Gear Points) API Endpoint
 */

// Helper function for CORS headers
function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

// GET /api/gp - Get GP history or total GP for players
async function handleGet(env, request) {
  try {
    const url = new URL(request.url);
    const player = url.searchParams.get('player');

    if (player) {
      // Get history for specific player
      const result = await env.DB.prepare(
        `SELECT id, player, gp, reason, timestamp FROM gp WHERE player = ? ORDER BY timestamp DESC`
      ).bind(player).all();

      // Calculate total
      const total = result.results.reduce((sum, row) => sum + row.gp, 0);

      return new Response(JSON.stringify({
        success: true,
        player: player,
        total: total,
        history: result.results
      }), {
        status: 200,
        headers: corsHeaders()
      });
    } else {
      // Get all GP data grouped by player
      const result = await env.DB.prepare(
        `SELECT player, SUM(gp) as total FROM gp GROUP BY player ORDER BY player ASC`
      ).all();

      return new Response(JSON.stringify({
        success: true,
        data: result.results
      }), {
        status: 200,
        headers: corsHeaders()
      });
    }
  } catch (error) {
    console.error('GET error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

// POST /api/gp - Add GP entry
async function handlePost(env, request) {
  try {
    const { player, gp, reason } = await request.json();

    if (!player || gp === undefined) {
      return new Response(JSON.stringify({ error: 'player and gp are required' }), {
        status: 400,
        headers: corsHeaders()
      });
    }

    await env.DB.prepare(
      `INSERT INTO gp (player, gp, reason) VALUES (?, ?, ?)`
    ).bind(player, parseFloat(gp), reason || null).run();

    return new Response(JSON.stringify({
      success: true,
      message: `Added GP for ${player}`
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

// DELETE /api/gp - Delete GP entry
async function handleDelete(env, request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'id parameter required' }), {
        status: 400,
        headers: corsHeaders()
      });
    }

    await env.DB.prepare(`DELETE FROM gp WHERE id = ?`).bind(parseInt(id)).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Deleted GP entry'
    }), {
      status: 200,
      headers: corsHeaders()
    });
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
      return await handleGet(env, request);
    } else if (request.method === 'POST') {
      return await handlePost(env, request);
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
