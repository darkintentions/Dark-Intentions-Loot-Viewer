/**
 * Loot API Endpoint
 * Handles GET (fetch all rows), POST (add rows), DELETE (clear all)
 */

// Ensure the loot table exists, create if missing
async function ensureTableExists(env) {
  try {
    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS loot (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player TEXT NOT NULL,
        item TEXT NOT NULL,
        boss TEXT,
        response TEXT,
        date TEXT,
        armor_type TEXT,
        gear_slot TEXT,
        class TEXT,
        instance TEXT,
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(player, item, boss, response, date)
      )`
    ).run();

    // Add new columns if they don't exist (for existing tables)
    const columnsToAdd = [
      { name: 'class', type: 'TEXT' },
      { name: 'instance', type: 'TEXT' },
      { name: 'note', type: 'TEXT' }
    ];

    for (const col of columnsToAdd) {
      try {
        await env.DB.prepare(`ALTER TABLE loot ADD COLUMN ${col.name} ${col.type}`).run();
      } catch (error) {
        // Column already exists, ignore
        if (!error.message.includes('duplicate column')) {
          console.warn(`Could not add column ${col.name}:`, error.message);
        }
      }
    }

    // Create indexes if they don't exist
    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_player ON loot(player)`).run();
    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_date ON loot(date)`).run();
    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_boss ON loot(boss)`).run();
  } catch (error) {
    console.error('Error ensuring table exists:', error);
    // Table might already exist, continue anyway
  }
}

// Helper function for CORS headers
function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

// OPTIONS request for CORS preflight
export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders()
    });
  }

  const { request, env } = context;
  const url = new URL(request.url);

  try {
    if (request.method === 'GET') {
      return await handleGet(env);
    } else if (request.method === 'POST') {
      return await handlePost(env, request);
    } else if (request.method === 'DELETE') {
      return await handleDelete(env);
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

/**
 * GET /api/loot - Fetch all loot records
 */
async function handleGet(env) {
  try {
    // Ensure table exists
    await ensureTableExists(env);

    const result = await env.DB.prepare(
      `SELECT id, player, item, boss, response, date, armor_type, gear_slot, class, instance, note, created_at
       FROM loot
       ORDER BY created_at DESC`
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

/**
 * POST /api/loot - Add new loot records
 * Expects: { rows: [{ player, item, boss, response, date, armor_type, gear_slot }, ...] }
 */
async function handlePost(env, request) {
  try {
    // Ensure table exists
    await ensureTableExists(env);

    const { rows } = await request.json();

    if (!Array.isArray(rows)) {
      return new Response(JSON.stringify({ error: 'Expected array of rows' }), {
        status: 400,
        headers: corsHeaders()
      });
    }

    let added = 0;
    let skipped = 0;

    // Insert each row
    for (const row of rows) {
      try {
        const result = await env.DB.prepare(
          `INSERT INTO loot (player, item, boss, response, date, armor_type, gear_slot, class, instance, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          row.player || '',
          row.item || '',
          row.boss || null,
          row.response || null,
          row.date || null,
          row.armor_type || null,
          row.gear_slot || null,
          row.class || null,
          row.instance || null,
          row.note || null
        ).run();

        added++;
      } catch (error) {
        // UNIQUE constraint violation - skip duplicate
        if (error.message.includes('UNIQUE')) {
          skipped++;
        } else {
          throw error;
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      added,
      skipped,
      message: `Added ${added} rows, skipped ${skipped} duplicates`
    }), {
      status: 201,
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

/**
 * DELETE /api/loot - Clear all loot records
 */
async function handleDelete(env) {
  try {
    // Ensure table exists
    await ensureTableExists(env);

    // Get count before deletion
    const countResult = await env.DB.prepare('SELECT COUNT(*) as count FROM loot').first();
    const countBefore = countResult?.count || 0;

    // Delete all rows
    await env.DB.prepare('DELETE FROM loot').run();

    return new Response(JSON.stringify({
      success: true,
      message: `Deleted ${countBefore} rows`,
      deletedCount: countBefore
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
