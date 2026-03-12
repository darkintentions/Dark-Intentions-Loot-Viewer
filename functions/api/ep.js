/**
 * EP (Effort Points) API Endpoint
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

// GET /api/ep - Get EP history or total EP for players
async function handleGet(env, request) {
  try {
    const url = new URL(request.url);
    const player = url.searchParams.get('player');

    if (player) {
      // Get history for specific player
      const result = await env.DB.prepare(
        `SELECT id, player, ep, reason, timestamp FROM ep WHERE player = ? ORDER BY timestamp DESC`
      ).bind(player).all();

      // Calculate total
      const total = result.results.reduce((sum, row) => sum + row.ep, 0);

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
      // Get all EP data grouped by player
      const result = await env.DB.prepare(
        `SELECT player, SUM(ep) as total FROM ep GROUP BY player ORDER BY player ASC`
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

// POST /api/ep - Add EP entry
async function handlePost(env, request) {
  try {
    const { player, ep, reason, timestamp } = await request.json();

    if (!player || ep === undefined) {
      return new Response(JSON.stringify({ error: 'player and ep are required' }), {
        status: 400,
        headers: corsHeaders()
      });
    }

    // Use provided timestamp or default to current time
    if (timestamp) {
      await env.DB.prepare(
        `INSERT INTO ep (player, ep, reason, timestamp) VALUES (?, ?, ?, ?)`
      ).bind(player, parseFloat(ep), reason || null, timestamp).run();
    } else {
      await env.DB.prepare(
        `INSERT INTO ep (player, ep, reason) VALUES (?, ?, ?)`
      ).bind(player, parseFloat(ep), reason || null).run();
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Added EP for ${player}`
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

// DELETE /api/ep - Delete EP entry
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

    await env.DB.prepare(`DELETE FROM ep WHERE id = ?`).bind(parseInt(id)).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Deleted EP entry'
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
