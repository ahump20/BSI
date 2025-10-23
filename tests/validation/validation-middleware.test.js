/**
 * VALIDATION MIDDLEWARE TESTS
 * Comprehensive tests for request validation middleware
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { validate, validationErrorHandler } from '../../api/middleware/validation.js';

describe('Validation Middleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        mockReq = {
            body: {},
            query: {},
            params: {},
            headers: {},
            path: '/test',
            method: 'GET'
        };

        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };

        mockNext = vi.fn();
    });

    describe('Body Validation', () => {
        it('should validate valid request body', async () => {
            const schema = z.object({
                name: z.string(),
                age: z.number().int().positive()
            });

            mockReq.body = { name: 'John Doe', age: 25 };

            const middleware = validate({ body: schema });
            await middleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should reject invalid request body', async () => {
            const schema = z.object({
                name: z.string(),
                age: z.number().int().positive()
            });

            mockReq.body = { name: 'John Doe', age: -5 };

            const middleware = validate({ body: schema });
            await middleware(mockReq, mockRes, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: 'Validation Error'
                })
            );
        });

        it('should handle missing required fields', async () => {
            const schema = z.object({
                name: z.string(),
                email: z.string().email()
            });

            mockReq.body = { name: 'John' };

            const middleware = validate({ body: schema });
            await middleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    details: expect.arrayContaining([
                        expect.objectContaining({
                            field: 'email'
                        })
                    ])
                })
            );
        });
    });

    describe('Query Validation', () => {
        it('should validate valid query parameters', async () => {
            const schema = z.object({
                page: z.coerce.number().int().positive(),
                limit: z.coerce.number().int().max(100)
            });

            mockReq.query = { page: '1', limit: '20' };

            const middleware = validate({ query: schema });
            await middleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.query.page).toBe(1);
            expect(mockReq.query.limit).toBe(20);
        });

        it('should reject invalid query parameters', async () => {
            const schema = z.object({
                page: z.coerce.number().int().positive()
            });

            mockReq.query = { page: '-1' };

            const middleware = validate({ query: schema });
            await middleware(mockReq, mockRes, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
    });

    describe('Params Validation', () => {
        it('should validate valid path parameters', async () => {
            const schema = z.object({
                sport: z.enum(['baseball', 'football', 'basketball']),
                teamId: z.string().min(1)
            });

            mockReq.params = { sport: 'baseball', teamId: 'team123' };

            const middleware = validate({ params: schema });
            await middleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should reject invalid enum values', async () => {
            const schema = z.object({
                sport: z.enum(['baseball', 'football', 'basketball'])
            });

            mockReq.params = { sport: 'invalid' };

            const middleware = validate({ params: schema });
            await middleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
    });

    describe('Combined Validation', () => {
        it('should validate all request parts', async () => {
            const schemas = {
                body: z.object({ data: z.string() }),
                query: z.object({ filter: z.string() }),
                params: z.object({ id: z.string() })
            };

            mockReq.body = { data: 'test' };
            mockReq.query = { filter: 'active' };
            mockReq.params = { id: '123' };

            const middleware = validate(schemas);
            await middleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should fail on first validation error', async () => {
            const schemas = {
                body: z.object({ data: z.string() }),
                query: z.object({ page: z.coerce.number().positive() })
            };

            mockReq.body = { data: 'test' };
            mockReq.query = { page: '-1' };

            const middleware = validate(schemas);
            await middleware(mockReq, mockRes, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
    });

    describe('Error Handling', () => {
        it('should handle unexpected errors gracefully', async () => {
            const schema = z.object({
                data: z.string().transform(() => {
                    throw new Error('Unexpected error');
                })
            });

            mockReq.body = { data: 'test' };

            const middleware = validate({ body: schema });
            await middleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Internal Server Error'
                })
            );
        });
    });
});

describe('Validation Error Handler', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        mockReq = {
            path: '/test',
            method: 'GET'
        };

        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };

        mockNext = vi.fn();
    });

    it('should handle ZodError', () => {
        const zodError = new z.ZodError([
            {
                code: 'invalid_type',
                expected: 'string',
                received: 'number',
                path: ['name'],
                message: 'Expected string, received number'
            }
        ]);

        validationErrorHandler(zodError, mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: 'Validation Error'
            })
        );
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass non-validation errors to next handler', () => {
        const regularError = new Error('Some other error');

        validationErrorHandler(regularError, mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(regularError);
        expect(mockRes.status).not.toHaveBeenCalled();
    });
});
