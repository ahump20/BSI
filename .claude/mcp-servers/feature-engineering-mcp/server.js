#!/usr/bin/env node

/**
 * Feature Engineering MCP Server
 *
 * Provides ML feature engineering context for Blaze Sports Intel development.
 * Exposes feature definitions from features-config/*.yaml and provides validation,
 * calculation templates, and feature engineering guidance.
 *
 * Resources:
 * - features://catalog - All available features by sport and category
 * - features://baseball/* - Baseball-specific features
 * - features://football/* - Football-specific features
 * - features://basketball/* - Basketball-specific features
 * - features://schema - Feature definition schema
 *
 * Tools:
 * - get_feature - Get detailed feature definition by ID
 * - validate_feature - Validate feature definition against schema
 * - search_features - Search features by sport, category, or keyword
 * - get_calculation - Get calculation template for feature
 * - list_dependencies - Get feature dependencies and required columns
 *
 * Usage:
 *   node server.js
 *
 * @author Blaze Sports Intel
 * @version 1.0.0
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const CONFIG = {
  SERVER_NAME: 'feature-engineering-mcp',
  SERVER_VERSION: '1.0.0',

  SPORTS: ['baseball', 'football', 'basketball'],

  CATEGORIES: [
    'team_performance',
    'player_performance',
    'advanced_metrics',
    'predictive',
    'situational',
    'momentum',
    'defensive',
    'offensive'
  ],

  // Feature catalog with inline definitions
  FEATURES: {
    baseball: {
      pythagorean_win_pct: {
        feature_id: 'baseball_pythagorean_win_pct',
        display_name: 'Pythagorean Win Percentage',
        sport: 'baseball',
        category: 'team_performance',
        data_type: 'float',
        description: 'Expected win percentage based on runs scored and allowed using Bill James formula',
        formula: 'runs_scored^2 / (runs_scored^2 + runs_allowed^2)',
        validation: {
          range: [0.0, 1.0],
          required_columns: ['runs_scored', 'runs_allowed']
        },
        sources: [
          {
            name: 'Bill James',
            url: 'https://www.baseball-reference.com/about/war_explained.shtml',
            type: 'statistical_method'
          }
        ],
        implementation: {
          language: 'python',
          function_name: 'calculate_pythagorean_win_pct',
          dependencies: ['numpy']
        }
      },

      bullpen_fatigue_index: {
        feature_id: 'baseball_bullpen_fatigue_index',
        display_name: 'Bullpen Fatigue Index',
        sport: 'baseball',
        category: 'predictive',
        data_type: 'float',
        description: '3-day rolling fatigue metric for relief pitchers based on appearances, pitch counts, and back-to-back usage',
        formula: 'weighted_sum(appearances_3d * 2.0, pitches_3d * 0.1, back_to_back_bonus * 5.0)',
        validation: {
          range: [0.0, 100.0],
          required_columns: ['pitcher_appearances', 'pitch_counts', 'dates']
        },
        sources: [
          {
            name: 'Internal Research',
            url: 'https://blazesportsintel.com/methodology',
            type: 'proprietary'
          }
        ],
        implementation: {
          language: 'python',
          function_name: 'calculate_bullpen_fatigue',
          dependencies: ['pandas', 'numpy']
        }
      },

      woba: {
        feature_id: 'baseball_woba',
        display_name: 'Weighted On-Base Average',
        sport: 'baseball',
        category: 'offensive',
        data_type: 'float',
        description: 'Weighted on-base average accounting for different hit values',
        formula: '(0.69*BB + 0.72*HBP + 0.89*1B + 1.27*2B + 1.62*3B + 2.10*HR) / (AB + BB - IBB + SF + HBP)',
        validation: {
          range: [0.0, 1.0],
          required_columns: ['walks', 'hit_by_pitch', 'singles', 'doubles', 'triples', 'home_runs', 'at_bats', 'sacrifice_flies']
        },
        sources: [
          {
            name: 'FanGraphs',
            url: 'https://library.fangraphs.com/offense/woba/',
            type: 'peer_reviewed'
          }
        ],
        implementation: {
          language: 'python',
          function_name: 'calculate_woba',
          dependencies: []
        }
      }
    },

    football: {
      epa_per_play: {
        feature_id: 'football_epa_per_play',
        display_name: 'Expected Points Added Per Play',
        sport: 'football',
        category: 'advanced_metrics',
        data_type: 'float',
        description: 'Average expected points added per offensive play',
        formula: 'sum(epa_values) / total_plays',
        validation: {
          range: [-2.0, 2.0],
          required_columns: ['down', 'distance', 'yard_line', 'play_result']
        },
        sources: [
          {
            name: 'Pro Football Reference',
            url: 'https://www.pro-football-reference.com/about/glossary.htm',
            type: 'statistical_method'
          }
        ],
        implementation: {
          language: 'python',
          function_name: 'calculate_epa_per_play',
          dependencies: ['nfl_data_py']
        }
      },

      success_rate: {
        feature_id: 'football_success_rate',
        display_name: 'Play Success Rate',
        sport: 'football',
        category: 'offensive',
        data_type: 'float',
        description: 'Percentage of plays achieving success thresholds (40% yards on 1st, 60% on 2nd, 100% on 3rd/4th)',
        formula: 'successful_plays / total_plays',
        validation: {
          range: [0.0, 1.0],
          required_columns: ['down', 'distance', 'yards_gained']
        },
        sources: [
          {
            name: 'Football Outsiders',
            url: 'https://www.footballoutsiders.com/stats/nfl/overall-dvoa/2024',
            type: 'statistical_method'
          }
        ],
        implementation: {
          language: 'python',
          function_name: 'calculate_success_rate',
          dependencies: []
        }
      },

      pressure_to_sack_rate: {
        feature_id: 'football_pressure_to_sack_rate',
        display_name: 'Pressure-to-Sack Conversion Rate',
        sport: 'football',
        category: 'defensive',
        data_type: 'float',
        description: 'Percentage of QB pressures that result in sacks',
        formula: 'sacks / (pressures + sacks)',
        validation: {
          range: [0.0, 1.0],
          required_columns: ['sacks', 'pressures']
        },
        sources: [
          {
            name: 'Pro Football Focus',
            url: 'https://www.pff.com/news/nfl-metrics-that-matter',
            type: 'proprietary'
          }
        ],
        implementation: {
          language: 'python',
          function_name: 'calculate_pressure_sack_rate',
          dependencies: []
        }
      }
    },

    basketball: {
      ts_percentage: {
        feature_id: 'basketball_ts_percentage',
        display_name: 'True Shooting Percentage',
        sport: 'basketball',
        category: 'offensive',
        data_type: 'float',
        description: 'Shooting efficiency accounting for 2pt, 3pt, and free throws',
        formula: 'points / (2 * (fga + 0.44 * fta))',
        validation: {
          range: [0.0, 1.0],
          required_columns: ['points', 'field_goal_attempts', 'free_throw_attempts']
        },
        sources: [
          {
            name: 'Basketball Reference',
            url: 'https://www.basketball-reference.com/about/glossary.html',
            type: 'statistical_method'
          }
        ],
        implementation: {
          language: 'python',
          function_name: 'calculate_true_shooting_pct',
          dependencies: []
        }
      },

      usage_rate: {
        feature_id: 'basketball_usage_rate',
        display_name: 'Usage Rate',
        sport: 'basketball',
        category: 'player_performance',
        data_type: 'float',
        description: 'Percentage of team plays used by player while on court',
        formula: '100 * ((FGA + 0.44 * FTA + TOV) * (Tm MP / 5)) / (MP * (Tm FGA + 0.44 * Tm FTA + Tm TOV))',
        validation: {
          range: [0.0, 100.0],
          required_columns: ['field_goal_attempts', 'free_throw_attempts', 'turnovers', 'minutes_played', 'team_field_goal_attempts', 'team_free_throw_attempts', 'team_turnovers', 'team_minutes_played']
        },
        sources: [
          {
            name: 'Basketball Reference',
            url: 'https://www.basketball-reference.com/about/glossary.html',
            type: 'statistical_method'
          }
        ],
        implementation: {
          language: 'python',
          function_name: 'calculate_usage_rate',
          dependencies: []
        }
      }
    }
  },

  // Feature schema definition
  SCHEMA: {
    type: 'object',
    required: ['feature_id', 'display_name', 'sport', 'category', 'data_type', 'formula'],
    properties: {
      feature_id: {
        type: 'string',
        pattern: '^[a-z]+_[a-z_]+$',
        description: 'Unique identifier in format: {sport}_{feature_name}'
      },
      display_name: {
        type: 'string',
        description: 'Human-readable feature name'
      },
      sport: {
        type: 'string',
        enum: ['baseball', 'football', 'basketball'],
        description: 'Sport identifier'
      },
      category: {
        type: 'string',
        enum: ['team_performance', 'player_performance', 'advanced_metrics', 'predictive', 'situational', 'momentum', 'defensive', 'offensive'],
        description: 'Feature category'
      },
      data_type: {
        type: 'string',
        enum: ['float', 'int', 'bool', 'string'],
        description: 'Data type of feature value'
      },
      description: {
        type: 'string',
        description: 'Detailed feature description'
      },
      formula: {
        type: 'string',
        description: 'Mathematical formula or calculation method'
      },
      validation: {
        type: 'object',
        properties: {
          range: {
            type: 'array',
            items: { type: 'number' },
            minItems: 2,
            maxItems: 2,
            description: 'Valid value range [min, max]'
          },
          required_columns: {
            type: 'array',
            items: { type: 'string' },
            description: 'Required data columns for calculation'
          }
        }
      },
      sources: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            url: { type: 'string', format: 'uri' },
            type: { type: 'string', enum: ['peer_reviewed', 'statistical_method', 'proprietary'] }
          }
        },
        description: 'Data sources and citations'
      },
      implementation: {
        type: 'object',
        properties: {
          language: { type: 'string' },
          function_name: { type: 'string' },
          dependencies: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        description: 'Implementation details'
      }
    }
  }
};

class FeatureEngineeringMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: CONFIG.SERVER_NAME,
        version: CONFIG.SERVER_VERSION,
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  setupHandlers() {
    // List all available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources = [
        {
          uri: 'features://catalog',
          name: 'Feature Catalog',
          description: 'All available ML features organized by sport and category',
          mimeType: 'application/json'
        },
        {
          uri: 'features://schema',
          name: 'Feature Schema',
          description: 'JSON schema for feature definition validation',
          mimeType: 'application/json'
        }
      ];

      // Add sport-specific resources
      for (const sport of CONFIG.SPORTS) {
        resources.push({
          uri: `features://${sport}/catalog`,
          name: `${sport.charAt(0).toUpperCase() + sport.slice(1)} Features`,
          description: `All ${sport} features with definitions and formulas`,
          mimeType: 'application/json'
        });
      }

      return { resources };
    });

    // Read specific resource
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;

      if (uri === 'features://catalog') {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(this.getCatalog(), null, 2)
            }
          ]
        };
      }

      if (uri === 'features://schema') {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(CONFIG.SCHEMA, null, 2)
            }
          ]
        };
      }

      // Sport-specific catalog
      const sportMatch = uri.match(/^features:\/\/([^/]+)\/catalog$/);
      if (sportMatch) {
        const sport = sportMatch[1];
        if (CONFIG.FEATURES[sport]) {
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  sport,
                  features: CONFIG.FEATURES[sport]
                }, null, 2)
              }
            ]
          };
        }
      }

      throw new Error(`Unknown resource: ${uri}`);
    });

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_feature',
            description: 'Get detailed feature definition by feature ID',
            inputSchema: {
              type: 'object',
              properties: {
                feature_id: {
                  type: 'string',
                  description: 'Feature ID in format {sport}_{feature_name}'
                }
              },
              required: ['feature_id']
            }
          },
          {
            name: 'validate_feature',
            description: 'Validate feature definition against schema',
            inputSchema: {
              type: 'object',
              properties: {
                feature_definition: {
                  type: 'object',
                  description: 'Feature definition object to validate'
                }
              },
              required: ['feature_definition']
            }
          },
          {
            name: 'search_features',
            description: 'Search features by sport, category, or keyword',
            inputSchema: {
              type: 'object',
              properties: {
                sport: {
                  type: 'string',
                  enum: ['baseball', 'football', 'basketball'],
                  description: 'Filter by sport'
                },
                category: {
                  type: 'string',
                  enum: CONFIG.CATEGORIES,
                  description: 'Filter by category'
                },
                keyword: {
                  type: 'string',
                  description: 'Search keyword in feature names and descriptions'
                }
              }
            }
          },
          {
            name: 'get_calculation',
            description: 'Get calculation template and implementation guide for feature',
            inputSchema: {
              type: 'object',
              properties: {
                feature_id: {
                  type: 'string',
                  description: 'Feature ID to get calculation for'
                },
                language: {
                  type: 'string',
                  enum: ['python', 'javascript', 'sql'],
                  description: 'Programming language for template'
                }
              },
              required: ['feature_id']
            }
          },
          {
            name: 'list_dependencies',
            description: 'Get feature dependencies and required data columns',
            inputSchema: {
              type: 'object',
              properties: {
                feature_id: {
                  type: 'string',
                  description: 'Feature ID to analyze dependencies'
                }
              },
              required: ['feature_id']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'get_feature':
          return await this.handleGetFeature(args);
        case 'validate_feature':
          return await this.handleValidateFeature(args);
        case 'search_features':
          return await this.handleSearchFeatures(args);
        case 'get_calculation':
          return await this.handleGetCalculation(args);
        case 'list_dependencies':
          return await this.handleListDependencies(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  getCatalog() {
    const catalog = {
      total_features: 0,
      sports: {}
    };

    for (const [sport, features] of Object.entries(CONFIG.FEATURES)) {
      const featureList = Object.values(features);
      catalog.sports[sport] = {
        count: featureList.length,
        categories: {},
        features: featureList
      };

      // Group by category
      featureList.forEach(feature => {
        if (!catalog.sports[sport].categories[feature.category]) {
          catalog.sports[sport].categories[feature.category] = [];
        }
        catalog.sports[sport].categories[feature.category].push(feature.feature_id);
      });

      catalog.total_features += featureList.length;
    }

    return catalog;
  }

  async handleGetFeature(args) {
    const { feature_id } = args;
    const [sport, ...featureParts] = feature_id.split('_');
    const featureName = featureParts.join('_');

    if (!CONFIG.FEATURES[sport] || !CONFIG.FEATURES[sport][featureName]) {
      throw new Error(`Feature not found: ${feature_id}`);
    }

    const feature = CONFIG.FEATURES[sport][featureName];

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(feature, null, 2)
        }
      ]
    };
  }

  async handleValidateFeature(args) {
    const { feature_definition } = args;
    const errors = [];

    // Check required fields
    const required = CONFIG.SCHEMA.required;
    required.forEach(field => {
      if (!feature_definition[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate feature_id format
    if (feature_definition.feature_id && !/^[a-z]+_[a-z_]+$/.test(feature_definition.feature_id)) {
      errors.push('feature_id must match pattern: {sport}_{feature_name}');
    }

    // Validate sport
    if (feature_definition.sport && !CONFIG.SPORTS.includes(feature_definition.sport)) {
      errors.push(`Invalid sport: ${feature_definition.sport}. Must be one of: ${CONFIG.SPORTS.join(', ')}`);
    }

    // Validate category
    if (feature_definition.category && !CONFIG.CATEGORIES.includes(feature_definition.category)) {
      errors.push(`Invalid category: ${feature_definition.category}. Must be one of: ${CONFIG.CATEGORIES.join(', ')}`);
    }

    // Validate data_type
    if (feature_definition.data_type && !['float', 'int', 'bool', 'string'].includes(feature_definition.data_type)) {
      errors.push(`Invalid data_type: ${feature_definition.data_type}`);
    }

    // Validate range if present
    if (feature_definition.validation?.range) {
      if (!Array.isArray(feature_definition.validation.range) || feature_definition.validation.range.length !== 2) {
        errors.push('validation.range must be array with exactly 2 numbers [min, max]');
      }
    }

    const valid = errors.length === 0;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            valid,
            errors,
            feature_id: feature_definition.feature_id
          }, null, 2)
        }
      ]
    };
  }

  async handleSearchFeatures(args) {
    const { sport, category, keyword } = args;
    const results = [];

    for (const [sportName, features] of Object.entries(CONFIG.FEATURES)) {
      // Filter by sport if specified
      if (sport && sportName !== sport) continue;

      for (const [featureName, feature] of Object.entries(features)) {
        // Filter by category if specified
        if (category && feature.category !== category) continue;

        // Filter by keyword if specified
        if (keyword) {
          const searchText = `${feature.display_name} ${feature.description} ${feature.formula}`.toLowerCase();
          if (!searchText.includes(keyword.toLowerCase())) continue;
        }

        results.push({
          feature_id: feature.feature_id,
          display_name: feature.display_name,
          sport: feature.sport,
          category: feature.category,
          description: feature.description
        });
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            query: { sport, category, keyword },
            result_count: results.length,
            results
          }, null, 2)
        }
      ]
    };
  }

  async handleGetCalculation(args) {
    const { feature_id, language = 'python' } = args;
    const [sport, ...featureParts] = feature_id.split('_');
    const featureName = featureParts.join('_');

    if (!CONFIG.FEATURES[sport] || !CONFIG.FEATURES[sport][featureName]) {
      throw new Error(`Feature not found: ${feature_id}`);
    }

    const feature = CONFIG.FEATURES[sport][featureName];
    const template = this.generateCalculationTemplate(feature, language);

    return {
      content: [
        {
          type: 'text',
          text: template
        }
      ]
    };
  }

  generateCalculationTemplate(feature, language) {
    const { feature_id, display_name, formula, validation, implementation } = feature;
    const required_cols = validation?.required_columns || [];

    if (language === 'python') {
      return `# ${display_name}
# Feature ID: ${feature_id}
# Formula: ${formula}

import pandas as pd
import numpy as np
${implementation?.dependencies?.length > 0 ? implementation.dependencies.map(d => `import ${d}`).join('\n') : ''}

def ${implementation?.function_name || 'calculate_' + feature_id}(df: pd.DataFrame) -> pd.Series:
    """
    Calculate ${display_name}

    Args:
        df: DataFrame with columns: ${required_cols.join(', ')}

    Returns:
        Series with calculated feature values

    Validation:
        Range: ${validation?.range ? `[${validation.range[0]}, ${validation.range[1]}]` : 'None'}
    """
    # Validate required columns
    missing_cols = set(${JSON.stringify(required_cols)}) - set(df.columns)
    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}")

    # TODO: Implement calculation based on formula: ${formula}
    # Example skeleton:
    result = pd.Series(dtype='float64', index=df.index)

    # Validate range if specified
    ${validation?.range ? `
    if result.min() < ${validation.range[0]} or result.max() > ${validation.range[1]}:
        raise ValueError(f"Result out of valid range: [{result.min()}, {result.max()}]")
    ` : ''}

    return result

# Example usage:
# df = pd.DataFrame({
${required_cols.map(col => `#     '${col}': [/* sample data */],`).join('\n')}
# })
# result = ${implementation?.function_name || 'calculate_' + feature_id}(df)
`;
    }

    if (language === 'javascript') {
      return `// ${display_name}
// Feature ID: ${feature_id}
// Formula: ${formula}

/**
 * Calculate ${display_name}
 *
 * @param {Object} data - Data object with properties: ${required_cols.join(', ')}
 * @returns {number} Calculated feature value
 *
 * Validation range: ${validation?.range ? `[${validation.range[0]}, ${validation.range[1]}]` : 'None'}
 */
function ${implementation?.function_name || 'calculate' + feature_id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}(data) {
  // Validate required fields
  const requiredFields = ${JSON.stringify(required_cols)};
  const missingFields = requiredFields.filter(field => !(field in data));
  if (missingFields.length > 0) {
    throw new Error(\`Missing required fields: \${missingFields.join(', ')}\`);
  }

  // TODO: Implement calculation based on formula: ${formula}
  let result = 0;

  // Validate range
  ${validation?.range ? `
  if (result < ${validation.range[0]} || result > ${validation.range[1]}) {
    throw new Error(\`Result \${result} out of valid range [${validation.range[0]}, ${validation.range[1]}]\`);
  }
  ` : ''}

  return result;
}

// Example usage:
// const data = {
${required_cols.map(col => `//   ${col}: /* value */,`).join('\n')}
// };
// const result = ${implementation?.function_name || 'calculate' + feature_id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}(data);
`;
    }

    return `Feature: ${display_name}
Formula: ${formula}
Required columns: ${required_cols.join(', ')}
Language '${language}' template not available. Supported: python, javascript`;
  }

  async handleListDependencies(args) {
    const { feature_id } = args;
    const [sport, ...featureParts] = feature_id.split('_');
    const featureName = featureParts.join('_');

    if (!CONFIG.FEATURES[sport] || !CONFIG.FEATURES[sport][featureName]) {
      throw new Error(`Feature not found: ${feature_id}`);
    }

    const feature = CONFIG.FEATURES[sport][featureName];
    const dependencies = {
      feature_id,
      data_dependencies: {
        required_columns: feature.validation?.required_columns || [],
        column_types: {}
      },
      code_dependencies: {
        language: feature.implementation?.language,
        packages: feature.implementation?.dependencies || []
      },
      source_dependencies: feature.sources || []
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(dependencies, null, 2)
        }
      ]
    };
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[FeatureEngineeringMCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Feature Engineering MCP Server running on stdio');
  }
}

// Create and run server
const server = new FeatureEngineeringMCPServer();
server.run().catch(console.error);

// Export for testing
module.exports = { FeatureEngineeringMCPServer, CONFIG };
