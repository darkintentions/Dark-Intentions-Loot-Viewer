/**
 * Points API Endpoint
 * Handles EP/GP history and gear slot points
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

// GET /api/points - Get EP/GP history for a player
async function handleGet(env, request) {
  try {
    const url = new URL(request.url);
    const player = url.searchParams.get('player');
    const type = url.searchParams.get('type'); // 'ep', 'gp', or 'both'

    if (!player || !type) {
      return new Response(JSON.stringify({ error: 'player and type parameters required' }), {
        status: 400,
        headers: corsHeaders()
      });
    }

    const result = {};

    if (type === 'ep' || type === 'both') {
      const epResult = await env.DB.prepare(
        `SELECT id, player, ep, reason, timestamp FROM ep WHERE player = ? ORDER BY timestamp DESC`
      ).bind(player).all();
      result.ep = epResult.results;
    }

    if (type === 'gp' || type === 'both') {
      const gpResult = await env.DB.prepare(
        `SELECT id, player, gp, reason, timestamp FROM gp WHERE player = ? ORDER BY timestamp DESC`
      ).bind(player).all();
      result.gp = gpResult.results;
    }

    return new Response(JSON.stringify({
      success: true,
      data: result
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

// POST /api/points - Add EP or GP entry
async function handlePost(env, request) {
  try {
    const { player, type, value, reason } = await request.json();

    if (!player || !type || value === undefined) {
      return new Response(JSON.stringify({ error: 'player, type, and value are required' }), {
        status: 400,
        headers: corsHeaders()
      });
    }

    if (type === 'ep') {
      await env.DB.prepare(
        `INSERT INTO ep (player, ep, reason) VALUES (?, ?, ?)`
      ).bind(player, parseFloat(value), reason || null).run();
    } else if (type === 'gp') {
      await env.DB.prepare(
        `INSERT INTO gp (player, gp, reason) VALUES (?, ?, ?)`
      ).bind(player, parseFloat(value), reason || null).run();
    } else {
      return new Response(JSON.stringify({ error: 'type must be "ep" or "gp"' }), {
        status: 400,
        headers: corsHeaders()
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Added ${type.toUpperCase()} entry for ${player}`
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

// DELETE /api/points - Delete EP or GP entry
async function handleDelete(env, request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type');

    if (!id || !type) {
      return new Response(JSON.stringify({ error: 'id and type parameters required' }), {
        status: 400,
        headers: corsHeaders()
      });
    }

    if (type === 'ep') {
      await env.DB.prepare(`DELETE FROM ep WHERE id = ?`).bind(parseInt(id)).run();
    } else if (type === 'gp') {
      await env.DB.prepare(`DELETE FROM gp WHERE id = ?`).bind(parseInt(id)).run();
    } else {
      return new Response(JSON.stringify({ error: 'type must be "ep" or "gp"' }), {
        status: 400,
        headers: corsHeaders()
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Deleted ${type.toUpperCase()} entry`
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
