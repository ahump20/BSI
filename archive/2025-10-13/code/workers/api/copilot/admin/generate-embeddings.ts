/**
 * Blaze Sports Intel - Admin Endpoint: Generate Embeddings
 *
 * POST /api/copilot/admin/generate-embeddings
 *
 * Generates embeddings for all games and stores them in Vectorize index.
 * This should be run after adding new games to the database.
 */

import { onRequest as generateEmbeddings } from '../../../../scripts/generate-game-embeddings';

export { generateEmbeddings as onRequest };
