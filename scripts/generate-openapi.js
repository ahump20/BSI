#!/usr/bin/env node
/**
 * OPENAPI/SWAGGER DOCUMENTATION GENERATOR
 * Generates OpenAPI 3.0 specification from validation schemas
 *
 * Usage: node scripts/generate-openapi.js
 * Output: docs/openapi.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// OpenAPI 3.0 specification template
const openApiSpec = {
    openapi: '3.0.3',
    info: {
        title: 'Blaze Sports Intel API',
        version: '2.0.0',
        description: 'Professional sports analytics API with machine learning predictions, real-time scores, and comprehensive team/player statistics.',
        contact: {
            name: 'Blaze Sports Intel',
            url: 'https://blazesportsintel.com',
            email: 'api@blazesportsintel.com'
        },
        license: {
            name: 'Proprietary',
            url: 'https://blazesportsintel.com/terms'
        }
    },
    servers: [
        {
            url: 'https://blazesportsintel.com/api',
            description: 'Production server'
        },
        {
            url: 'http://localhost:3000/api',
            description: 'Development server'
        }
    ],
    tags: [
        {
            name: 'Predictions',
            description: 'Machine learning game and player predictions'
        },
        {
            name: 'Teams',
            description: 'Team information, analytics, and statistics'
        },
        {
            name: 'Players',
            description: 'Player information, statistics, and projections'
        },
        {
            name: 'Live Data',
            description: 'Real-time scores and game updates'
        },
        {
            name: 'Scheduling',
            description: 'Schedule optimization and Monte Carlo simulations'
        },
        {
            name: 'Sports Specific',
            description: 'Sport-specific endpoints (MLB, NFL, NBA, NCAA)'
        },
        {
            name: 'Health',
            description: 'API health and status endpoints'
        }
    ],
    paths: {},
    components: {
        schemas: {
            ValidationError: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                        example: false
                    },
                    error: {
                        type: 'string',
                        example: 'Validation Error'
                    },
                    message: {
                        type: 'string',
                        example: 'Invalid request parameters'
                    },
                    details: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                field: { type: 'string' },
                                message: { type: 'string' },
                                code: { type: 'string' }
                            }
                        }
                    }
                }
            },
            ServerError: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                        example: false
                    },
                    error: {
                        type: 'string',
                        example: 'Internal Server Error'
                    },
                    message: {
                        type: 'string',
                        example: 'An unexpected error occurred'
                    },
                    timestamp: {
                        type: 'string',
                        format: 'date-time'
                    }
                }
            },
            RateLimitError: {
                type: 'object',
                properties: {
                    error: {
                        type: 'string',
                        example: 'Rate Limit Exceeded'
                    },
                    message: {
                        type: 'string',
                        example: 'Too many requests. Maximum 100 requests per 60 seconds.'
                    },
                    retryAfter: {
                        type: 'integer',
                        example: 60
                    }
                }
            }
        },
        responses: {
            ValidationError: {
                description: 'Validation error',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ValidationError'
                        }
                    }
                }
            },
            ServerError: {
                description: 'Internal server error',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ServerError'
                        }
                    }
                }
            },
            RateLimitError: {
                description: 'Rate limit exceeded',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/RateLimitError'
                        }
                    }
                },
                headers: {
                    'Retry-After': {
                        schema: {
                            type: 'integer'
                        },
                        description: 'Seconds to wait before retrying'
                    }
                }
            },
            NotFound: {
                description: 'Resource not found',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                success: { type: 'boolean', example: false },
                                error: { type: 'string', example: 'Not Found' },
                                message: { type: 'string' }
                            }
                        }
                    }
                }
            }
        },
        parameters: {
            SportParam: {
                name: 'sport',
                in: 'path',
                required: true,
                description: 'Sport identifier',
                schema: {
                    type: 'string',
                    enum: ['baseball', 'football', 'basketball', 'hockey', 'mlb', 'nfl', 'nba', 'nhl', 'ncaab', 'ncaaf']
                }
            },
            TeamKeyParam: {
                name: 'teamKey',
                in: 'path',
                required: true,
                description: 'Team identifier',
                schema: {
                    type: 'string',
                    pattern: '^[a-zA-Z0-9_-]+$'
                }
            },
            SeasonQuery: {
                name: 'season',
                in: 'query',
                required: false,
                description: 'Season year or year range (e.g., 2024 or 2023-2024)',
                schema: {
                    type: 'string',
                    pattern: '^\\d{4}(-\\d{4})?$'
                }
            },
            DateQuery: {
                name: 'date',
                in: 'query',
                required: false,
                description: 'Date in YYYY-MM-DD format',
                schema: {
                    type: 'string',
                    format: 'date',
                    pattern: '^\\d{4}-\\d{2}-\\d{2}$'
                }
            },
            LimitQuery: {
                name: 'limit',
                in: 'query',
                required: false,
                description: 'Maximum number of results to return',
                schema: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 100,
                    default: 20
                }
            },
            OffsetQuery: {
                name: 'offset',
                in: 'query',
                required: false,
                description: 'Number of results to skip',
                schema: {
                    type: 'integer',
                    minimum: 0,
                    default: 0
                }
            }
        }
    }
};

// API endpoints definition
const endpoints = {
    '/health': {
        get: {
            tags: ['Health'],
            summary: 'API health check',
            description: 'Returns API health status and service information',
            responses: {
                '200': {
                    description: 'Successful response',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    status: { type: 'string', example: 'healthy' },
                                    version: { type: 'string', example: '2.0.0' },
                                    timestamp: { type: 'string', format: 'date-time' }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/predict/game': {
        post: {
            tags: ['Predictions'],
            summary: 'Predict game outcome',
            description: 'Machine learning prediction for a single game outcome',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['homeTeam', 'awayTeam', 'sport'],
                            properties: {
                                homeTeam: {
                                    type: 'string',
                                    description: 'Home team identifier',
                                    example: 'texas-longhorns'
                                },
                                awayTeam: {
                                    type: 'string',
                                    description: 'Away team identifier',
                                    example: 'oklahoma-sooners'
                                },
                                sport: {
                                    type: 'string',
                                    enum: ['baseball', 'football', 'basketball', 'hockey'],
                                    example: 'football'
                                },
                                gameDate: {
                                    type: 'string',
                                    format: 'date',
                                    description: 'Game date (YYYY-MM-DD)',
                                    example: '2024-10-12'
                                },
                                venue: {
                                    type: 'string',
                                    description: 'Venue name',
                                    example: 'Darrell K Royal–Texas Memorial Stadium'
                                },
                                weather: {
                                    type: 'object',
                                    properties: {
                                        temperature: { type: 'number', example: 75 },
                                        conditions: { type: 'string', example: 'clear' },
                                        windSpeed: { type: 'number', example: 10 }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Successful prediction',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean' },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            predictedWinner: { type: 'string' },
                                            winProbability: { type: 'number', minimum: 0, maximum: 1 },
                                            confidence: { type: 'string', enum: ['low', 'medium', 'high', 'very_high'] },
                                            predictedScore: {
                                                type: 'object',
                                                properties: {
                                                    home: { type: 'integer' },
                                                    away: { type: 'integer' }
                                                }
                                            }
                                        }
                                    },
                                    metadata: {
                                        type: 'object',
                                        properties: {
                                            generatedAt: { type: 'string', format: 'date-time' },
                                            methodology: { type: 'string' },
                                            dataSource: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                '400': {
                    $ref: '#/components/responses/ValidationError'
                },
                '429': {
                    $ref: '#/components/responses/RateLimitError'
                },
                '500': {
                    $ref: '#/components/responses/ServerError'
                }
            }
        }
    },
    '/team/{sport}/{teamKey}/analytics': {
        get: {
            tags: ['Teams'],
            summary: 'Get team analytics',
            description: 'Comprehensive team analytics with ML predictions',
            parameters: [
                {
                    $ref: '#/components/parameters/SportParam'
                },
                {
                    $ref: '#/components/parameters/TeamKeyParam'
                },
                {
                    $ref: '#/components/parameters/SeasonQuery'
                },
                {
                    name: 'includeAdvanced',
                    in: 'query',
                    schema: { type: 'boolean', default: false },
                    description: 'Include advanced analytics'
                },
                {
                    name: 'includeTrends',
                    in: 'query',
                    schema: { type: 'boolean', default: false },
                    description: 'Include performance trends'
                }
            ],
            responses: {
                '200': {
                    description: 'Successful response',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean' },
                                    data: { type: 'object' },
                                    metadata: { type: 'object' }
                                }
                            }
                        }
                    }
                },
                '400': {
                    $ref: '#/components/responses/ValidationError'
                },
                '404': {
                    $ref: '#/components/responses/NotFound'
                },
                '429': {
                    $ref: '#/components/responses/RateLimitError'
                },
                '500': {
                    $ref: '#/components/responses/ServerError'
                }
            }
        }
    },
    '/live-scores': {
        get: {
            tags: ['Live Data'],
            summary: 'Get live scores',
            description: 'Real-time scores and game updates',
            parameters: [
                {
                    name: 'sport',
                    in: 'query',
                    schema: {
                        type: 'string',
                        enum: ['baseball', 'football', 'basketball', 'hockey', 'mlb', 'nfl', 'nba']
                    },
                    description: 'Sport filter'
                },
                {
                    name: 'league',
                    in: 'query',
                    schema: {
                        type: 'string',
                        enum: ['mlb', 'nfl', 'nba', 'nhl', 'ncaab', 'ncaaf']
                    },
                    description: 'League filter'
                },
                {
                    $ref: '#/components/parameters/LimitQuery'
                }
            ],
            responses: {
                '200': {
                    description: 'Successful response',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    timestamp: { type: 'string', format: 'date-time' },
                                    games: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                gameId: { type: 'string' },
                                                homeTeam: { type: 'object' },
                                                awayTeam: { type: 'object' },
                                                status: { type: 'string' },
                                                score: { type: 'object' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                '400': {
                    $ref: '#/components/responses/ValidationError'
                },
                '429': {
                    $ref: '#/components/responses/RateLimitError'
                },
                '500': {
                    $ref: '#/components/responses/ServerError'
                }
            }
        }
    },
    '/v1/scheduling/optimizer': {
        post: {
            tags: ['Scheduling'],
            summary: 'Optimize schedule projection',
            description: 'Monte Carlo simulation for schedule optimization and RPI/SOR projection',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['teamId', 'futureOpponents'],
                            properties: {
                                teamId: { type: 'string' },
                                conference: { type: 'string' },
                                futureOpponents: {
                                    type: 'array',
                                    minItems: 1,
                                    maxItems: 50,
                                    items: {
                                        type: 'object',
                                        required: ['teamId'],
                                        properties: {
                                            teamId: { type: 'string' },
                                            location: {
                                                type: 'string',
                                                enum: ['home', 'away', 'neutral']
                                            },
                                            rank: { type: 'integer' },
                                            winPct: { type: 'number', minimum: 0, maximum: 1 }
                                        }
                                    }
                                },
                                userTier: {
                                    type: 'string',
                                    enum: ['free', 'basic', 'pro', 'diamond'],
                                    default: 'free'
                                },
                                iterations: {
                                    type: 'integer',
                                    minimum: 100,
                                    maximum: 10000,
                                    default: 100
                                },
                                deterministic: {
                                    type: 'boolean',
                                    default: false
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Successful projection',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean' },
                                    data: { type: 'object' },
                                    tierAccess: { type: 'object' },
                                    performance: { type: 'object' }
                                }
                            }
                        }
                    }
                },
                '400': {
                    $ref: '#/components/responses/ValidationError'
                },
                '429': {
                    $ref: '#/components/responses/RateLimitError'
                },
                '500': {
                    $ref: '#/components/responses/ServerError'
                }
            }
        }
    }
};

// Merge endpoints into spec
openApiSpec.paths = endpoints;

// Write to file
const outputPath = path.join(__dirname, '..', 'docs', 'openapi.json');
const outputDir = path.dirname(outputPath);

// Ensure docs directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(openApiSpec, null, 2));

console.log('✓ OpenAPI specification generated successfully');
console.log(`  Output: ${outputPath}`);
console.log(`  Endpoints: ${Object.keys(endpoints).length}`);
console.log(`  Tags: ${openApiSpec.tags.length}`);
console.log('\nYou can now:');
console.log('  1. View with Swagger UI: https://editor.swagger.io/');
console.log('  2. Import into Postman');
console.log('  3. Generate client libraries');
console.log('  4. Host with Swagger UI or ReDoc');
