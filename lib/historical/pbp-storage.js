/**
 * Blaze Sports Intel - Play-by-Play R2 Storage Handler
 *
 * Stores parsed play-by-play data in Cloudflare R2 object storage
 * with D1 database references for querying and retrieval.
 *
 * Storage Strategy:
 * - Large PBP JSON blobs stored in R2 (unlimited size)
 * - D1 stores metadata and references (fast queries)
 * - Organized by sport/season/game_id for efficient retrieval
 */

/**
 * Store play-by-play data in R2
 *
 * @param {Object} env - Cloudflare environment bindings
 * @param {string} gameId - Game identifier
 * @param {string} sport - Sport type (MLB, NFL, NBA, NCAA_FOOTBALL)
 * @param {number} season - Season year
 * @param {Object} pbpData - Parsed play-by-play data
 * @returns {Promise<Object>} Storage result with R2 key
 */
export async function storePBPData(env, gameId, sport, season, pbpData) {
  try {
    // Generate R2 object key
    const r2Key = generateR2Key(sport, season, gameId);

    // Compress and store in R2
    const jsonData = JSON.stringify(pbpData);
    const compressedData = await compressData(jsonData);

    await env.R2_STORAGE.put(r2Key, compressedData, {
      httpMetadata: {
        contentType: 'application/json',
        contentEncoding: 'gzip',
      },
      customMetadata: {
        sport,
        season: season.toString(),
        game_id: gameId,
        stored_at: new Date().toISOString(),
        uncompressed_size: jsonData.length.toString(),
        compressed_size: compressedData.byteLength.toString(),
      },
    });

    // Store reference in D1
    await env.DB.prepare(
      `
      INSERT OR REPLACE INTO pbp_storage_refs (
        game_id, sport, season, r2_key,
        uncompressed_size, compressed_size,
        play_count, stored_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
      .bind(
        gameId,
        sport,
        season,
        r2Key,
        jsonData.length,
        compressedData.byteLength,
        pbpData.plays?.length || pbpData.summary?.total_plays || 0,
        new Date().toISOString()
      )
      .run();

    console.log(
      `✅ Stored PBP for ${gameId} in R2: ${r2Key} (${formatBytes(compressedData.byteLength)})`
    );

    return {
      success: true,
      game_id: gameId,
      r2_key: r2Key,
      uncompressed_size: jsonData.length,
      compressed_size: compressedData.byteLength,
      compression_ratio: ((compressedData.byteLength / jsonData.length) * 100).toFixed(1) + '%',
    };
  } catch (error) {
    console.error(`❌ Failed to store PBP for ${gameId}:`, error);
    throw error;
  }
}

/**
 * Retrieve play-by-play data from R2
 *
 * @param {Object} env - Cloudflare environment bindings
 * @param {string} gameId - Game identifier
 * @returns {Promise<Object>} Parsed PBP data
 */
export async function retrievePBPData(env, gameId) {
  try {
    // Get R2 key from D1
    const ref = await env.DB.prepare(
      `
      SELECT r2_key, sport, season FROM pbp_storage_refs
      WHERE game_id = ?
    `
    )
      .bind(gameId)
      .first();

    if (!ref) {
      throw new Error(`No PBP data found for game: ${gameId}`);
    }

    // Fetch from R2
    const r2Object = await env.R2_STORAGE.get(ref.r2_key);

    if (!r2Object) {
      throw new Error(`R2 object not found: ${ref.r2_key}`);
    }

    // Decompress and parse
    const compressedData = await r2Object.arrayBuffer();
    const jsonData = await decompressData(compressedData);
    const pbpData = JSON.parse(jsonData);

    console.log(`✅ Retrieved PBP for ${gameId} from R2`);

    return {
      game_id: gameId,
      sport: ref.sport,
      season: ref.season,
      data: pbpData,
    };
  } catch (error) {
    console.error(`❌ Failed to retrieve PBP for ${gameId}:`, error);
    throw error;
  }
}

/**
 * Batch retrieve multiple games' PBP data
 *
 * @param {Object} env - Cloudflare environment bindings
 * @param {Array<string>} gameIds - Array of game identifiers
 * @returns {Promise<Array<Object>>} Array of PBP data objects
 */
export async function batchRetrievePBPData(env, gameIds) {
  const results = [];

  // Get all R2 keys in one query
  const placeholders = gameIds.map(() => '?').join(',');
  const refs = await env.DB.prepare(
    `
    SELECT game_id, r2_key, sport, season FROM pbp_storage_refs
    WHERE game_id IN (${placeholders})
  `
  )
    .bind(...gameIds)
    .all();

  // Fetch from R2 in parallel
  const r2Promises = refs.results.map(async (ref) => {
    try {
      const r2Object = await env.R2_STORAGE.get(ref.r2_key);
      if (!r2Object) return null;

      const compressedData = await r2Object.arrayBuffer();
      const jsonData = await decompressData(compressedData);
      const pbpData = JSON.parse(jsonData);

      return {
        game_id: ref.game_id,
        sport: ref.sport,
        season: ref.season,
        data: pbpData,
      };
    } catch (error) {
      console.error(`Failed to retrieve ${ref.game_id}:`, error);
      return null;
    }
  });

  const retrieved = await Promise.all(r2Promises);

  return retrieved.filter(Boolean);
}

/**
 * Delete play-by-play data from R2 and D1
 *
 * @param {Object} env - Cloudflare environment bindings
 * @param {string} gameId - Game identifier
 * @returns {Promise<boolean>} Success status
 */
export async function deletePBPData(env, gameId) {
  try {
    // Get R2 key
    const ref = await env.DB.prepare(
      `
      SELECT r2_key FROM pbp_storage_refs WHERE game_id = ?
    `
    )
      .bind(gameId)
      .first();

    if (!ref) {
      console.warn(`No PBP reference found for ${gameId}`);
      return false;
    }

    // Delete from R2
    await env.R2_STORAGE.delete(ref.r2_key);

    // Delete reference from D1
    await env.DB.prepare(
      `
      DELETE FROM pbp_storage_refs WHERE game_id = ?
    `
    )
      .bind(gameId)
      .run();

    console.log(`✅ Deleted PBP for ${gameId}`);

    return true;
  } catch (error) {
    console.error(`❌ Failed to delete PBP for ${gameId}:`, error);
    throw error;
  }
}

/**
 * Get storage statistics
 *
 * @param {Object} env - Cloudflare environment bindings
 * @param {string} sport - Optional sport filter
 * @param {number} season - Optional season filter
 * @returns {Promise<Object>} Storage statistics
 */
export async function getStorageStats(env, sport = null, season = null) {
  let query =
    'SELECT sport, season, COUNT(*) as game_count, SUM(compressed_size) as total_size FROM pbp_storage_refs';
  const params = [];

  if (sport) {
    query += ' WHERE sport = ?';
    params.push(sport);

    if (season) {
      query += ' AND season = ?';
      params.push(season);
    }
  } else if (season) {
    query += ' WHERE season = ?';
    params.push(season);
  }

  query += ' GROUP BY sport, season ORDER BY sport, season DESC';

  const stats = await env.DB.prepare(query)
    .bind(...params)
    .all();

  const summary = {
    total_games: 0,
    total_size_bytes: 0,
    by_sport: {},
  };

  for (const row of stats.results || []) {
    summary.total_games += row.game_count;
    summary.total_size_bytes += row.total_size;

    if (!summary.by_sport[row.sport]) {
      summary.by_sport[row.sport] = {
        total_games: 0,
        total_size_bytes: 0,
        seasons: [],
      };
    }

    summary.by_sport[row.sport].total_games += row.game_count;
    summary.by_sport[row.sport].total_size_bytes += row.total_size;
    summary.by_sport[row.sport].seasons.push({
      season: row.season,
      game_count: row.game_count,
      size_bytes: row.total_size,
      size_formatted: formatBytes(row.total_size),
    });
  }

  return {
    ...summary,
    total_size_formatted: formatBytes(summary.total_size_bytes),
  };
}

/**
 * Generate R2 object key
 */
function generateR2Key(sport, season, gameId) {
  const sanitizedGameId = gameId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `pbp/${sport.toLowerCase()}/${season}/${sanitizedGameId}.json.gz`;
}

/**
 * Compress data using gzip
 */
async function compressData(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // Use CompressionStream API (available in Cloudflare Workers)
  const compressedStream = new ReadableStream({
    start(controller) {
      controller.enqueue(dataBuffer);
      controller.close();
    },
  }).pipeThrough(new CompressionStream('gzip'));

  const chunks = [];
  const reader = compressedStream.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  // Concatenate chunks into single ArrayBuffer
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result.buffer;
}

/**
 * Decompress gzip data
 */
async function decompressData(compressedData) {
  const decompressedStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(compressedData));
      controller.close();
    },
  }).pipeThrough(new DecompressionStream('gzip'));

  const chunks = [];
  const reader = decompressedStream.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  const decoder = new TextDecoder();
  return decoder.decode(result);
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
