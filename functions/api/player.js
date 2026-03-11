/**
 * Player Management API Endpoint
 * Handles player deletion and retrieval
 */

// Helper function for CORS headers
function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

// GET /api/player - Get all unique players
async function handleGet(env) {
  try {
    const result = await env.DB.prepare(
      `SELECT DISTINCT player FROM loot ORDER BY player ASC`
    ).all();

    const players = result.results.map(row => row.player);

    return new Response(JSON.stringify({
      success: true,
      data: players
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

// DELETE /api/player - Delete a player and all their data
async function handleDelete(env, request) {
  try {
    const url = new URL(request.url);
    const player = url.searchParams.get('player');

    if (!player) {
      return new Response(JSON.stringify({ error: 'player parameter required' }), {
        status: 400,
        headers: corsHeaders()
      });
    }

    // Delete from all tables related to the player
    await env.DB.prepare(`DELETE FROM loot WHERE player = ?`).bind(player).run();
    await env.DB.prepare(`DELETE FROM roster WHERE player = ?`).bind(player).run();
    await env.DB.prepare(`DELETE FROM ep WHERE player = ?`).bind(player).run();
    await env.DB.prepare(`DELETE FROM gp WHERE player = ?`).bind(player).run();

    return new Response(JSON.stringify({
      success: true,
      message: `Deleted player ${player} and all their data`
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
      return await handleGet(env);
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
