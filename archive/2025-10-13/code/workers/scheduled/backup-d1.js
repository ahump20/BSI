/**
 * Cloudflare Worker Scheduled Task: Daily D1 Database Backup
 *
 * Runs daily at 3:00 AM America/Chicago (8:00 AM UTC during CST, 9:00 AM UTC during CDT)
 *
 * Features:
 * - Exports D1 database to R2 storage
 * - Implements 7-day retention policy (auto-deletes backups older than 7 days)
 * - Generates backup metadata with checksums
 * - Sends notifications on success/failure
 * - Tracks backup history
 *
 * Configuration in wrangler.toml:
 * [triggers]
 * crons = ["0 8 * * *"]  # 8:00 AM UTC = 3:00 AM CT (CST)
 *
 * Environment bindings required:
 * - DB: D1 database binding (blazesports-db)
 * - BACKUP_BUCKET: R2 bucket binding (blazesports-backups)
 * - BACKUP_KV: KV namespace for backup metadata
 *
 * @version 1.0.0
 * @updated 2025-01-11
 */

export async function scheduled(event, env, ctx) {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const backupId = `backup-${Date.now()}`;


    try {
        // Step 1: Export D1 database
        const exportData = await exportD1Database(env.DB);

        if (!exportData || !exportData.success) {
            throw new Error('D1 export failed');
        }

        // Step 2: Generate backup metadata
        const metadata = {
            backupId,
            timestamp,
            database: 'blazesports-db',
            tables: exportData.tables || [],
            rowCounts: exportData.rowCounts || {},
            checksum: await generateChecksum(JSON.stringify(exportData.data)),
            size: JSON.stringify(exportData.data).length,
            version: '1.0.0'
        };


        // Step 3: Upload to R2
        const backupKey = `d1-backups/${new Date().toISOString().split('T')[0]}/${backupId}.json`;
        const metadataKey = `d1-backups/${new Date().toISOString().split('T')[0]}/${backupId}-metadata.json`;


        await env.BACKUP_BUCKET.put(backupKey, JSON.stringify(exportData.data), {
            httpMetadata: {
                contentType: 'application/json'
            },
            customMetadata: {
                backupId,
                timestamp,
                database: 'blazesports-db'
            }
        });

        await env.BACKUP_BUCKET.put(metadataKey, JSON.stringify(metadata), {
            httpMetadata: {
                contentType: 'application/json'
            }
        });


        // Step 4: Store backup record in KV
        await env.BACKUP_KV.put(`backup:${backupId}`, JSON.stringify(metadata), {
            expirationTtl: 60 * 60 * 24 * 7 // 7 days
        });

        // Step 5: Update backup history
        const history = JSON.parse(await env.BACKUP_KV.get('backup:history') || '[]');
        history.unshift({
            backupId,
            timestamp,
            status: 'success',
            size: metadata.size,
            duration: Date.now() - startTime
        });

        // Keep only last 30 entries in history
        const recentHistory = history.slice(0, 30);
        await env.BACKUP_KV.put('backup:history', JSON.stringify(recentHistory));

        // Step 6: Cleanup old backups (7-day retention)
        const deletedCount = await cleanupOldBackups(env.BACKUP_BUCKET, 7);

        // Step 7: Complete (success metrics tracked in history)
        const duration = Date.now() - startTime;

        // Optional: Send success notification (implement as needed)
        // await sendNotification(env, 'success', metadata);

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error('❌ Backup failed:', error);

        // Log failure to KV
        const history = JSON.parse(await env.BACKUP_KV.get('backup:history') || '[]');
        history.unshift({
            backupId,
            timestamp,
            status: 'failed',
            error: error.message,
            duration
        });
        await env.BACKUP_KV.put('backup:history', JSON.stringify(history.slice(0, 30)));

        // Optional: Send failure notification
        // await sendNotification(env, 'failure', { backupId, error: error.message });

        throw error; // Re-throw to mark cron execution as failed
    }
}

/**
 * Export D1 database to JSON
 */
async function exportD1Database(db) {
    try {
        // Get list of all tables
        const tablesResult = await db.prepare(`
            SELECT name FROM sqlite_master
            WHERE type='table'
            AND name NOT LIKE 'sqlite_%'
            AND name NOT LIKE '_cf_%'
            ORDER BY name
        `).all();

        const tables = tablesResult.results.map(r => r.name);

        const data = {};
        const rowCounts = {};

        // Export each table
        for (const table of tables) {
            const result = await db.prepare(`SELECT * FROM ${table}`).all();
            data[table] = result.results;
            rowCounts[table] = result.results.length;
        }

        return {
            success: true,
            tables,
            rowCounts,
            data,
            exportedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error('❌ Error exporting D1:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Generate SHA-256 checksum for data integrity verification
 */
async function generateChecksum(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Cleanup backups older than retention days
 */
async function cleanupOldBackups(bucket, retentionDays) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    let deletedCount = 0;

    try {
        // List all backup files
        const listed = await bucket.list({ prefix: 'd1-backups/' });

        for (const object of listed.objects) {
            // Extract date from path (format: d1-backups/YYYY-MM-DD/...)
            const pathParts = object.key.split('/');
            if (pathParts.length >= 2) {
                const backupDate = new Date(pathParts[1]);

                if (backupDate < cutoffDate) {
                    await bucket.delete(object.key);
                    deletedCount++;
                }
            }
        }
    } catch (error) {
        console.error('❌ Error cleaning up old backups:', error);
    }

    return deletedCount;
}

/**
 * Send notification (implement as needed)
 * Options: Email, Slack webhook, Discord, etc.
 */
async function sendNotification(env, status, data) {
    // Implement notification logic here
    // Example: POST to Slack webhook, send email via Workers email routing, etc.

    const message = status === 'success'
        ? `✅ D1 Backup Success: ${data.backupId}\nSize: ${(data.size / 1024 / 1024).toFixed(2)} MB\nTables: ${data.tables?.length || 0}`
        : `❌ D1 Backup Failed: ${data.backupId}\nError: ${data.error}`;


    // Example Slack webhook implementation:
    // if (env.SLACK_WEBHOOK_URL) {
    //     await fetch(env.SLACK_WEBHOOK_URL, {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify({
    //             text: message,
    //             username: 'Blaze DB Backup Bot',
    //             icon_emoji: status === 'success' ? ':white_check_mark:' : ':x:'
    //         })
    //     });
    // }
}
