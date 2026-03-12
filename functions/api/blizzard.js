/**
 * Blizzard WoW API Integration
 * Fetches item data from official Blizzard API
 */

// Helper function for CORS headers
function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

/**
 * Get OAuth2 access token from Blizzard
 */
async function getBlizzardAccessToken(env) {
  try {
    const clientId = env.BLIZZARD_CLIENT_ID;
    const clientSecret = env.BLIZZARD_CLIENT_SECRET;

    console.log('[Blizzard Auth] Attempting authentication...');
    console.log('[Blizzard Auth] Client ID present:', !!clientId);
    console.log('[Blizzard Auth] Client Secret present:', !!clientSecret);

    if (!clientId || !clientSecret) {
      throw new Error('Blizzard API credentials not configured');
    }

    const auth = btoa(`${clientId}:${clientSecret}`);

    const response = await fetch('https://oauth.battle.net/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    console.log('[Blizzard Auth] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Blizzard Auth] Error response:', errorText);
      throw new Error(`Blizzard auth failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[Blizzard Auth] Successfully obtained access token');
    return data.access_token;
  } catch (error) {
    console.error('Failed to get Blizzard access token:', error);
    throw error;
  }
}

/**
 * Fetch item data from Blizzard API
 */
async function fetchBlizzardItemData(itemId, accessToken) {
  try {
    const url = `https://us.api.blizzard.com/data/wow/item/${itemId}?namespace=static-us&locale=en_US&access_token=${accessToken}`;

    console.log('[Blizzard Item Fetch] Fetching item:', itemId);
    const response = await fetch(url);

    console.log('[Blizzard Item Fetch] Response status:', response.status);

    if (!response.ok) {
      if (response.status === 404) {
        console.log('[Blizzard Item Fetch] Item not found (404)');
        return null; // Item not found
      }
      const errorText = await response.text();
      console.error('[Blizzard Item Fetch] Error response:', errorText.substring(0, 200));
      throw new Error(`Blizzard API error: ${response.statusText}`);
    }

    const itemData = await response.json();

    // Extract relevant fields
    return {
      itemId: itemData.id,
      itemName: itemData.name,
      quality: itemData.quality?.name || null,
      itemClass: itemData.item_class?.name || null,
      itemSubClass: itemData.item_subclass?.name || null,
      inventoryType: itemData.inventory_type?.name || null,
      armor: itemData.armor?.value || null,
      bindingType: itemData.binding?.name || null,
      requiredLevel: itemData.required_level || null,
      sellPrice: itemData.sell_price || null
    };
  } catch (error) {
    console.error('Failed to fetch Blizzard item data:', error);
    throw error;
  }
}

/**
 * GET /api/blizzard/item/{itemId}
 * Fetch item data from Blizzard API
 */
async function handleGet(env, itemId) {
  try {
    if (!itemId) {
      return new Response(JSON.stringify({ error: 'itemId is required' }), {
        status: 400,
        headers: corsHeaders()
      });
    }

    // Get access token
    const accessToken = await getBlizzardAccessToken(env);

    // Fetch item data
    const itemData = await fetchBlizzardItemData(itemId, accessToken);

    if (!itemData) {
      return new Response(JSON.stringify({
        error: 'Item not found',
        itemId: itemId
      }), {
        status: 404,
        headers: corsHeaders()
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: itemData,
      source: 'blizzard'
    }), {
      status: 200,
      headers: corsHeaders()
    });
  } catch (error) {
    console.error('Error in blizzard API:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

/**
 * Main request handler
 */
export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders()
    });
  }

  const { request, env } = context;
  const url = new URL(request.url);

  // Extract itemId from query parameter: /api/blizzard?itemId=251168
  const itemId = url.searchParams.get('itemId');

  console.log('[Blizzard API] Request received for itemId:', itemId);

  if (request.method === 'GET') {
    return await handleGet(env, itemId);
  } else {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders()
    });
  }
}
