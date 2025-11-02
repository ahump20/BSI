/**
 * Object storage service for model artifacts.
 * Supports Cloudflare R2 (S3-compatible) with local disk fallback.
 */

import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

class ObjectStorageService {
    constructor(config = {}, logger = console) {
        this.logger = logger;
        this.bucket = config.bucket;
        this.prefix = config.prefix || 'models';
        this.localPath = config.localPath || path.join(process.cwd(), 'storage', 'models');

        if (config.accountId && config.accessKeyId && config.secretAccessKey && this.bucket) {
            const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;
            this.client = new S3Client({
                region: 'auto',
                endpoint,
                credentials: {
                    accessKeyId: config.accessKeyId,
                    secretAccessKey: config.secretAccessKey
                }
            });
        } else {
            this.client = null;
            this.logger?.warn?.('ObjectStorageService running in local fallback mode');
        }
    }

    buildKey(key) {
        if (!key) {
            throw new Error('Storage key is required');
        }
        return this.prefix ? `${this.prefix}/${key}` : key;
    }

    async putJson(key, data) {
        const body = JSON.stringify(data, null, 2);
        const storageKey = this.buildKey(key);

        if (this.client && this.bucket) {
            await this.client.send(new PutObjectCommand({
                Bucket: this.bucket,
                Key: storageKey,
                Body: body,
                ContentType: 'application/json'
            }));
            this.logger?.info?.('Stored artifact in R2', { key: storageKey, bucket: this.bucket });
            return storageKey;
        }

        const filePath = path.join(this.localPath, storageKey);
        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
        await fs.promises.writeFile(filePath, body, 'utf-8');
        this.logger?.info?.('Stored artifact on local disk', { key: storageKey, filePath });
        return storageKey;
    }

    async getJson(key) {
        const storageKey = this.buildKey(key);

        if (this.client && this.bucket) {
            const response = await this.client.send(new GetObjectCommand({
                Bucket: this.bucket,
                Key: storageKey
            }));
            const text = await response.Body.transformToString();
            return JSON.parse(text);
        }

        const filePath = path.join(this.localPath, storageKey);
        const content = await fs.promises.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    }

    async exists(key) {
        try {
            await this.getJson(key);
            return true;
        } catch (error) {
            if (error.name === 'NoSuchKey' || error.code === 'ENOENT') {
                return false;
            }
            throw error;
        }
    }
}

export default ObjectStorageService;
