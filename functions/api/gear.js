/**
 * Gear Slot Points API Endpoint
 * Manages point values for WoW gear slots
 */

// Helper function for CORS headers
function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

// GET /api/gear - Fetch all gear slot points
async function handleGet(env) {
  try {
    const result = await env.DB.prepare(
      `SELECT id, gear_slot, points FROM gear_slot_points ORDER BY gear_slot ASC`
    ).all();

    return new Response(JSON.stringify({
      success: true,
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

// POST /api/gear - Update gear slot points (bulk)
async function handlePost(env, request) {
  try {
    const { gearSlots } = await request.json();

    if (!Array.isArray(gearSlots)) {
      return new Response(JSON.stringify({ error: 'Expected array of gear slots' }), {
        status: 400,
        headers: corsHeaders()
      });
    }

    let updated = 0;
    for (const { gearSlot, points } of gearSlots) {
      if (!gearSlot) continue;

      await env.DB.prepare(
        `INSERT INTO gear_slot_points (gear_slot, points)
         VALUES (?, ?)
         ON CONFLICT(gear_slot) DO UPDATE SET points = EXCLUDED.points`
      ).bind(gearSlot, parseFloat(points) || 0).run();
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
    console.error('POST error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

// PUT /api/gear - Update single gear slot
async function handlePut(env, request) {
  try {
    const { gearSlot, points } = await request.json();

    if (!gearSlot) {
      return new Response(JSON.stringify({ error: 'gearSlot is required' }), {
        status: 400,
        headers: corsHeaders()
      });
    }

    await env.DB.prepare(
      `INSERT INTO gear_slot_points (gear_slot, points)
       VALUES (?, ?)
       ON CONFLICT(gear_slot) DO UPDATE SET points = EXCLUDED.points`
    ).bind(gearSlot, parseFloat(points) || 0).run();

    return new Response(JSON.stringify({
      success: true,
      message: `Updated ${gearSlot}`
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
