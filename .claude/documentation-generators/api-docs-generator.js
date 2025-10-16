#!/usr/bin/env node

/**
 * API Documentation Generator
 *
 * Automatically generates comprehensive API documentation from Cloudflare Functions
 * by analyzing function files, JSDoc comments, route patterns, and request/response schemas.
 *
 * Features:
 * - Parses Cloudflare Pages Functions directory structure
 * - Extracts route patterns and HTTP methods
 * - Analyzes JSDoc comments for endpoint descriptions
 * - Infers request/response schemas from code
 * - Generates OpenAPI 3.0 specification
 * - Creates Markdown documentation
 * - Validates endpoint implementations
 *
 * Output:
 * - OpenAPI spec (JSON) for automated tooling
 * - Markdown docs (human-readable)
 * - Postman collection (import ready)
 * - Example requests (cURL/JavaScript)
 *
 * @author Blaze Sports Intel
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');

const CONFIG = {
  // Input directories
  FUNCTIONS_DIR: path.join(__dirname, '../../functions'),

  // Output directories
  OUTPUT_DIR: path.join(__dirname, '../../docs/api'),
  OPENAPI_FILE: 'openapi.json',
  MARKDOWN_FILE: 'API.md',
  POSTMAN_FILE: 'postman-collection.json',
  EXAMPLES_DIR: 'examples',

  // Timezone for timestamps
  TIMEZONE: 'America/Chicago',

  // Base URL for API
  BASE_URL: 'https://blazesportsintel.com',
  API_VERSION: 'v1',

  // HTTP methods to recognize
  HTTP_METHODS: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Common response codes
  RESPONSE_CODES: {
    200: 'Success',
    201: 'Created',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    503: 'Service Unavailable'
  }
};

class APIDocGenerator {
  constructor() {
    this.endpoints = [];
    this.schemas = {};
    this.timestamp = new Date().toLocaleString('en-US', {
      timeZone: CONFIG.TIMEZONE
    });
  }

  /**
   * Main execution method
   */
  async generate() {
    console.log('📚 API Documentation Generator');
    console.log('='.repeat(50));
    console.log(`Timestamp: ${this.timestamp}`);
    console.log('');

    try {
      // 1. Scan functions directory
      console.log('1. Scanning functions directory...');
      await this.scanFunctions();
      console.log(`   Found ${this.endpoints.length} endpoints`);

      // 2. Analyze each endpoint
      console.log('2. Analyzing endpoint implementations...');
      await this.analyzeEndpoints();
      console.log(`   Analyzed ${this.endpoints.length} endpoints`);

      // 3. Generate documentation formats
      console.log('3. Generating documentation...');
      await this.generateOpenAPI();
      await this.generateMarkdown();
      await this.generatePostmanCollection();
      await this.generateExamples();
      console.log('   Generated 4 documentation formats');

      // 4. Validate endpoints
      console.log('4. Validating endpoint implementations...');
      const validationResults = await this.validateEndpoints();
      console.log(`   Validation: ${validationResults.passed}/${validationResults.total} passed`);

      console.log('');
      console.log('✅ Documentation generation complete!');
      console.log(`   Output: ${CONFIG.OUTPUT_DIR}`);

    } catch (error) {
      console.error('❌ Documentation generation failed:', error);
      throw error;
    }
  }

  /**
   * Scan functions directory for API endpoints
   */
  async scanFunctions() {
    const functionsDir = CONFIG.FUNCTIONS_DIR;

    try {
      await this.scanDirectory(functionsDir, '/api');
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn(`   ⚠️  Functions directory not found: ${functionsDir}`);
        console.warn('   Creating example endpoints for documentation...');
        this.createExampleEndpoints();
      } else {
        throw error;
      }
    }
  }

  /**
   * Recursively scan directory for function files
   */
  async scanDirectory(dir, routePrefix = '') {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Recurse into subdirectories
          const newPrefix = `${routePrefix}/${entry.name}`;
          await this.scanDirectory(fullPath, newPrefix);

        } else if (entry.isFile() && entry.name.endsWith('.js')) {
          // Parse function file
          await this.parseFunctionFile(fullPath, routePrefix, entry.name);
        }
      }
    } catch (error) {
      console.warn(`   ⚠️  Could not scan directory ${dir}:`, error.message);
    }
  }

  /**
   * Parse a function file to extract endpoint information
   */
  async parseFunctionFile(filePath, routePrefix, fileName) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Determine route from file structure
      let route = this.determineRoute(routePrefix, fileName);

      // Extract JSDoc comments
      const jsdoc = this.extractJSDoc(content);

      // Detect HTTP methods
      const methods = this.detectHTTPMethods(content);

      // Extract request/response schemas
      const schemas = this.extractSchemas(content);

      // Parse parameters
      const parameters = this.extractParameters(content, route);

      // Create endpoint object
      this.endpoints.push({
        route,
        methods,
        file: path.relative(CONFIG.FUNCTIONS_DIR, filePath),
        description: jsdoc.description || 'No description provided',
        summary: jsdoc.summary || this.generateSummary(route),
        tags: jsdoc.tags || [this.getTagFromRoute(route)],
        parameters,
        requestSchema: schemas.request,
        responseSchema: schemas.response,
        examples: this.generateExampleForEndpoint(route, methods[0]),
        deprecated: jsdoc.deprecated || false,
        authentication: this.detectAuthentication(content)
      });

    } catch (error) {
      console.warn(`   ⚠️  Could not parse ${filePath}:`, error.message);
    }
  }

  /**
   * Determine API route from file path and name
   */
  determineRoute(routePrefix, fileName) {
    // Handle dynamic routes: [[param]].js
    if (fileName.match(/\[\[(.+?)\]\]\.js$/)) {
      const param = fileName.match(/\[\[(.+?)\]\]/)[1];
      return `${routePrefix}/:${param}`;
    }

    // Handle single param: [param].js
    if (fileName.match(/\[(.+?)\]\.js$/)) {
      const param = fileName.match(/\[(.+?)\]/)[1];
      return `${routePrefix}/:${param}`;
    }

    // Standard file: endpoint.js
    if (fileName === 'index.js') {
      return routePrefix || '/';
    }

    return `${routePrefix}/${fileName.replace('.js', '')}`;
  }

  /**
   * Extract JSDoc comments from code
   */
  extractJSDoc(content) {
    const jsdocRegex = /\/\*\*([\s\S]*?)\*\//g;
    const matches = content.match(jsdocRegex);

    if (!matches || matches.length === 0) {
      return {};
    }

    // Parse the first JSDoc block (typically the main documentation)
    const jsdoc = matches[0];

    return {
      description: this.extractJSDocTag(jsdoc, 'description') ||
                   this.extractJSDocDescription(jsdoc),
      summary: this.extractJSDocTag(jsdoc, 'summary'),
      tags: this.extractJSDocTags(jsdoc),
      deprecated: jsdoc.includes('@deprecated')
    };
  }

  /**
   * Extract description from JSDoc block
   */
  extractJSDocDescription(jsdoc) {
    // Remove /** and */
    const cleaned = jsdoc.replace(/\/\*\*|\*\//g, '');

    // Get first paragraph (before @tags)
    const lines = cleaned.split('\n')
      .map(line => line.replace(/^\s*\*\s?/, '').trim())
      .filter(line => line && !line.startsWith('@'));

    return lines.join(' ').trim();
  }

  /**
   * Extract specific JSDoc tag
   */
  extractJSDocTag(jsdoc, tagName) {
    const regex = new RegExp(`@${tagName}\\s+(.+?)(?=\\n\\s*@|\\n\\s*\\*\\/|$)`, 's');
    const match = jsdoc.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * Extract JSDoc tags for categorization
   */
  extractJSDocTags(jsdoc) {
    const tagRegex = /@tag\s+(\w+)/g;
    const tags = [];
    let match;

    while ((match = tagRegex.exec(jsdoc)) !== null) {
      tags.push(match[1]);
    }

    return tags.length > 0 ? tags : null;
  }

  /**
   * Detect HTTP methods used in function
   */
  detectHTTPMethods(content) {
    const methods = [];

    // Check for onRequest export (handles all methods)
    if (content.includes('export async function onRequest') ||
        content.includes('exports.onRequest')) {
      return ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    }

    // Check for specific method exports
    for (const method of CONFIG.HTTP_METHODS) {
      const pattern = new RegExp(`on${method}|exports\\.on${method}`, 'i');
      if (pattern.test(content)) {
        methods.push(method);
      }
    }

    // Default to GET if no methods detected
    return methods.length > 0 ? methods : ['GET'];
  }

  /**
   * Extract request/response schemas from code
   */
  extractSchemas(content) {
    const schemas = {
      request: null,
      response: null
    };

    // Look for schema definitions in comments or code
    const schemaRegex = /@schema\s+(\w+)\s*\{([\s\S]*?)\}/g;
    let match;

    while ((match = schemaRegex.exec(content)) !== null) {
      const schemaType = match[1].toLowerCase();
      const schemaContent = match[2];

      if (schemaType === 'request') {
        schemas.request = this.parseSchemaContent(schemaContent);
      } else if (schemaType === 'response') {
        schemas.response = this.parseSchemaContent(schemaContent);
      }
    }

    // Infer response schema from return statements
    if (!schemas.response) {
      schemas.response = this.inferResponseSchema(content);
    }

    return schemas;
  }

  /**
   * Parse schema content into structured format
   */
  parseSchemaContent(schemaContent) {
    // Simple schema parser (can be enhanced)
    try {
      return JSON.parse(schemaContent);
    } catch {
      return { type: 'object', description: schemaContent.trim() };
    }
  }

  /**
   * Infer response schema from code
   */
  inferResponseSchema(content) {
    // Look for common response patterns
    if (content.includes('return ok(') || content.includes('Response.json(')) {
      return {
        type: 'object',
        properties: {
          data: { type: 'object', description: 'Response data' },
          timestamp: { type: 'string', description: 'Response timestamp' },
          meta: { type: 'object', description: 'Response metadata' }
        }
      };
    }

    return null;
  }

  /**
   * Extract route parameters from content and route
   */
  extractParameters(content, route) {
    const parameters = [];

    // Extract path parameters from route
    const pathParams = route.match(/:(\w+)/g);
    if (pathParams) {
      for (const param of pathParams) {
        const paramName = param.substring(1);
        parameters.push({
          name: paramName,
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: this.inferParameterDescription(paramName, content)
        });
      }
    }

    // Extract query parameters from searchParams usage
    const queryParamRegex = /searchParams\.get\(['"](\w+)['"]\)/g;
    let match;

    while ((match = queryParamRegex.exec(content)) !== null) {
      const paramName = match[1];
      if (!parameters.find(p => p.name === paramName)) {
        parameters.push({
          name: paramName,
          in: 'query',
          required: false,
          schema: { type: 'string' },
          description: this.inferParameterDescription(paramName, content)
        });
      }
    }

    return parameters;
  }

  /**
   * Infer parameter description from context
   */
  inferParameterDescription(paramName, content) {
    // Look for comments near parameter usage
    const regex = new RegExp(`\\/\\/\\s*(.+?)\\s*${paramName}`, 'i');
    const match = content.match(regex);

    if (match) {
      return match[1].trim();
    }

    // Generate generic description
    return `${paramName.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}`;
  }

  /**
   * Detect authentication requirements
   */
  detectAuthentication(content) {
    if (content.includes('Authorization') ||
        content.includes('Bearer') ||
        content.includes('authenticate')) {
      return {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      };
    }

    if (content.includes('API_KEY') || content.includes('X-API-Key')) {
      return {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key'
      };
    }

    return null;
  }

  /**
   * Analyze endpoints for completeness
   */
  async analyzeEndpoints() {
    for (const endpoint of this.endpoints) {
      // Check for documentation completeness
      endpoint.completeness = {
        hasDescription: !!endpoint.description && endpoint.description !== 'No description provided',
        hasParameters: endpoint.parameters.length > 0,
        hasRequestSchema: !!endpoint.requestSchema,
        hasResponseSchema: !!endpoint.responseSchema,
        hasExamples: !!endpoint.examples
      };

      endpoint.completenessScore = Object.values(endpoint.completeness)
        .filter(Boolean).length / Object.keys(endpoint.completeness).length * 100;
    }
  }

  /**
   * Generate OpenAPI 3.0 specification
   */
  async generateOpenAPI() {
    const spec = {
      openapi: '3.0.0',
      info: {
        title: 'Blaze Sports Intel API',
        description: 'Comprehensive sports intelligence API providing real-time data, analytics, and predictions across MLB, NFL, NCAA Football, NCAA Basketball, and youth sports.',
        version: CONFIG.API_VERSION,
        contact: {
          name: 'Blaze Sports Intel',
          email: 'austin@blazesportsintel.com',
          url: 'https://blazesportsintel.com'
        },
        license: {
          name: 'Proprietary',
          url: 'https://blazesportsintel.com/legal/terms'
        }
      },
      servers: [
        {
          url: `${CONFIG.BASE_URL}/api`,
          description: 'Production server'
        }
      ],
      paths: {},
      components: {
        schemas: this.schemas,
        securitySchemes: this.extractSecuritySchemes()
      },
      tags: this.extractTags()
    };

    // Build paths
    for (const endpoint of this.endpoints) {
      const path = endpoint.route.replace(/:(\w+)/g, '{$1}');

      if (!spec.paths[path]) {
        spec.paths[path] = {};
      }

      for (const method of endpoint.methods) {
        spec.paths[path][method.toLowerCase()] = {
          summary: endpoint.summary,
          description: endpoint.description,
          tags: endpoint.tags,
          parameters: endpoint.parameters,
          responses: this.generateResponses(endpoint),
          deprecated: endpoint.deprecated
        };

        if (endpoint.authentication) {
          spec.paths[path][method.toLowerCase()].security = [
            { [endpoint.authentication.type]: [] }
          ];
        }
      }
    }

    // Write to file
    await fs.mkdir(CONFIG.OUTPUT_DIR, { recursive: true });
    await fs.writeFile(
      path.join(CONFIG.OUTPUT_DIR, CONFIG.OPENAPI_FILE),
      JSON.stringify(spec, null, 2)
    );
  }

  /**
   * Generate response definitions for OpenAPI
   */
  generateResponses(endpoint) {
    const responses = {};

    // Success response
    responses['200'] = {
      description: CONFIG.RESPONSE_CODES[200],
      content: {
        'application/json': {
          schema: endpoint.responseSchema || {
            type: 'object',
            properties: {
              data: { type: 'object' }
            }
          }
        }
      }
    };

    // Error responses
    for (const [code, description] of Object.entries(CONFIG.RESPONSE_CODES)) {
      if (code !== '200' && code !== '201') {
        responses[code] = {
          description,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string' },
                  message: { type: 'string' },
                  timestamp: { type: 'string' }
                }
              }
            }
          }
        };
      }
    }

    return responses;
  }

  /**
   * Extract security schemes from endpoints
   */
  extractSecuritySchemes() {
    const schemes = {};

    for (const endpoint of this.endpoints) {
      if (endpoint.authentication) {
        const { type, scheme, bearerFormat, name } = endpoint.authentication;
        schemes[type] = endpoint.authentication;
      }
    }

    return schemes;
  }

  /**
   * Extract unique tags from endpoints
   */
  extractTags() {
    const tagSet = new Set();

    for (const endpoint of this.endpoints) {
      if (endpoint.tags) {
        endpoint.tags.forEach(tag => tagSet.add(tag));
      }
    }

    return Array.from(tagSet).map(tag => ({
      name: tag,
      description: this.getTagDescription(tag)
    }));
  }

  /**
   * Get tag from route
   */
  getTagFromRoute(route) {
    const parts = route.split('/').filter(Boolean);
    return parts[1] || 'General';
  }

  /**
   * Get tag description
   */
  getTagDescription(tag) {
    const descriptions = {
      'mlb': 'Major League Baseball endpoints',
      'nfl': 'National Football League endpoints',
      'cfb': 'College Football endpoints',
      'cbb': 'College Basketball endpoints',
      'ncaa': 'NCAA sports endpoints',
      'analytics': 'Advanced analytics and predictions',
      'copilot': 'AI-powered sports intelligence'
    };

    return descriptions[tag.toLowerCase()] || `${tag} endpoints`;
  }

  /**
   * Generate summary from route
   */
  generateSummary(route) {
    const parts = route.split('/').filter(Boolean);
    const action = parts[parts.length - 1];

    if (action.includes(':')) {
      return `Get ${action.replace(':', '')} details`;
    }

    return `${action.charAt(0).toUpperCase() + action.slice(1)} endpoint`;
  }

  /**
   * Generate example requests for endpoint
   */
  generateExampleForEndpoint(route, method) {
    const url = `${CONFIG.BASE_URL}${route}`;

    return {
      curl: `curl -X ${method} "${url}"`,
      javascript: `fetch('${url}', { method: '${method}' })\n  .then(res => res.json())\n  .then(data => console.log(data));`,
      description: `Example ${method} request to ${route}`
    };
  }

  /**
   * Generate Markdown documentation
   */
  async generateMarkdown() {
    let md = `# Blaze Sports Intel API Documentation\n\n`;
    md += `**Generated:** ${this.timestamp} (America/Chicago)\n\n`;
    md += `## Overview\n\n`;
    md += `Comprehensive sports intelligence API providing real-time data, analytics, and predictions across multiple sports.\n\n`;

    md += `**Base URL:** \`${CONFIG.BASE_URL}/api\`\n\n`;
    md += `**API Version:** ${CONFIG.API_VERSION}\n\n`;

    // Group endpoints by tag
    const endpointsByTag = this.groupEndpointsByTag();

    for (const [tag, endpoints] of Object.entries(endpointsByTag)) {
      md += `## ${tag}\n\n`;

      for (const endpoint of endpoints) {
        md += `### ${endpoint.methods.join(', ')} ${endpoint.route}\n\n`;
        md += `${endpoint.description}\n\n`;

        if (endpoint.deprecated) {
          md += `> **⚠️ DEPRECATED**: This endpoint is deprecated and may be removed in future versions.\n\n`;
        }

        // Parameters
        if (endpoint.parameters.length > 0) {
          md += `**Parameters:**\n\n`;
          md += `| Name | Location | Required | Type | Description |\n`;
          md += `|------|----------|----------|------|-------------|\n`;

          for (const param of endpoint.parameters) {
            md += `| ${param.name} | ${param.in} | ${param.required ? 'Yes' : 'No'} | ${param.schema.type} | ${param.description} |\n`;
          }
          md += `\n`;
        }

        // Example request
        if (endpoint.examples) {
          md += `**Example Request:**\n\n`;
          md += `\`\`\`bash\n${endpoint.examples.curl}\n\`\`\`\n\n`;

          md += `\`\`\`javascript\n${endpoint.examples.javascript}\n\`\`\`\n\n`;
        }

        md += `**Implementation:** \`${endpoint.file}\`\n\n`;
        md += `---\n\n`;
      }
    }

    // Write to file
    await fs.writeFile(
      path.join(CONFIG.OUTPUT_DIR, CONFIG.MARKDOWN_FILE),
      md
    );
  }

  /**
   * Group endpoints by tag
   */
  groupEndpointsByTag() {
    const grouped = {};

    for (const endpoint of this.endpoints) {
      const tag = endpoint.tags?.[0] || 'General';

      if (!grouped[tag]) {
        grouped[tag] = [];
      }

      grouped[tag].push(endpoint);
    }

    return grouped;
  }

  /**
   * Generate Postman collection
   */
  async generatePostmanCollection() {
    const collection = {
      info: {
        name: 'Blaze Sports Intel API',
        description: 'Complete API collection for Blaze Sports Intel platform',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: []
    };

    const endpointsByTag = this.groupEndpointsByTag();

    for (const [tag, endpoints] of Object.entries(endpointsByTag)) {
      const folder = {
        name: tag,
        item: []
      };

      for (const endpoint of endpoints) {
        for (const method of endpoint.methods) {
          folder.item.push({
            name: `${method} ${endpoint.route}`,
            request: {
              method,
              header: [],
              url: {
                raw: `${CONFIG.BASE_URL}${endpoint.route}`,
                protocol: 'https',
                host: [CONFIG.BASE_URL.replace('https://', '')],
                path: endpoint.route.split('/').filter(Boolean)
              },
              description: endpoint.description
            }
          });
        }
      }

      collection.item.push(folder);
    }

    // Write to file
    await fs.writeFile(
      path.join(CONFIG.OUTPUT_DIR, CONFIG.POSTMAN_FILE),
      JSON.stringify(collection, null, 2)
    );
  }

  /**
   * Generate code examples for common use cases
   */
  async generateExamples() {
    const examplesDir = path.join(CONFIG.OUTPUT_DIR, CONFIG.EXAMPLES_DIR);
    await fs.mkdir(examplesDir, { recursive: true });

    // JavaScript example
    const jsExample = this.generateJavaScriptExample();
    await fs.writeFile(
      path.join(examplesDir, 'example.js'),
      jsExample
    );

    // Python example
    const pyExample = this.generatePythonExample();
    await fs.writeFile(
      path.join(examplesDir, 'example.py'),
      pyExample
    );

    // cURL examples
    const curlExample = this.generateCurlExamples();
    await fs.writeFile(
      path.join(examplesDir, 'curl-examples.sh'),
      curlExample
    );
  }

  /**
   * Generate JavaScript example code
   */
  generateJavaScriptExample() {
    const example = this.endpoints[0];
    if (!example) return '// No endpoints available';

    return `/**
 * Blaze Sports Intel API - JavaScript Example
 *
 * Example usage of the Blaze Sports Intel API using fetch
 */

const BASE_URL = '${CONFIG.BASE_URL}/api';

// Example: ${example.summary}
async function ${this.toCamelCase(example.route.split('/').pop())}() {
  try {
    const response = await fetch(\`\${BASE_URL}${example.route}\`);

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const data = await response.json();
    console.log('Success:', data);
    return data;

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Run example
${this.toCamelCase(example.route.split('/').pop())}();
`;
  }

  /**
   * Generate Python example code
   */
  generatePythonExample() {
    const example = this.endpoints[0];
    if (!example) return '# No endpoints available';

    return `"""
Blaze Sports Intel API - Python Example

Example usage of the Blaze Sports Intel API using requests library
"""

import requests
from typing import Dict, Any

BASE_URL = '${CONFIG.BASE_URL}/api'

def ${this.toSnakeCase(example.route.split('/').pop())}() -> Dict[str, Any]:
    """
    ${example.summary}

    Returns:
        dict: API response data
    """
    try:
        response = requests.get(f'{BASE_URL}${example.route}')
        response.raise_for_status()

        data = response.json()
        print('Success:', data)
        return data

    except requests.exceptions.RequestException as error:
        print(f'Error: {error}')
        raise

if __name__ == '__main__':
    ${this.toSnakeCase(example.route.split('/').pop())}()
`;
  }

  /**
   * Generate cURL examples
   */
  generateCurlExamples() {
    let examples = `#!/bin/bash
# Blaze Sports Intel API - cURL Examples
# Generated: ${this.timestamp}

BASE_URL="${CONFIG.BASE_URL}/api"

`;

    for (const endpoint of this.endpoints.slice(0, 5)) {
      examples += `# ${endpoint.summary}\n`;
      examples += `curl -X ${endpoint.methods[0]} "\${BASE_URL}${endpoint.route}"\n\n`;
    }

    return examples;
  }

  /**
   * Validate endpoint implementations
   */
  async validateEndpoints() {
    const results = {
      total: this.endpoints.length,
      passed: 0,
      failed: 0,
      warnings: []
    };

    for (const endpoint of this.endpoints) {
      const issues = [];

      // Check for documentation
      if (!endpoint.description || endpoint.description === 'No description provided') {
        issues.push('Missing description');
      }

      // Check for parameters documentation
      if (endpoint.parameters.length === 0 && endpoint.route.includes(':')) {
        issues.push('Route has parameters but none documented');
      }

      // Check for examples
      if (!endpoint.examples) {
        issues.push('Missing examples');
      }

      // Check completeness score
      if (endpoint.completenessScore < 60) {
        issues.push(`Low completeness score: ${endpoint.completenessScore.toFixed(0)}%`);
      }

      if (issues.length === 0) {
        results.passed++;
      } else {
        results.failed++;
        results.warnings.push({
          endpoint: endpoint.route,
          issues
        });
      }
    }

    // Write validation report
    await this.writeValidationReport(results);

    return results;
  }

  /**
   * Write validation report
   */
  async writeValidationReport(results) {
    let report = `# API Documentation Validation Report\n\n`;
    report += `**Generated:** ${this.timestamp}\n\n`;
    report += `## Summary\n\n`;
    report += `- **Total Endpoints:** ${results.total}\n`;
    report += `- **Passed:** ${results.passed}\n`;
    report += `- **Failed:** ${results.failed}\n`;
    report += `- **Success Rate:** ${((results.passed / results.total) * 100).toFixed(1)}%\n\n`;

    if (results.warnings.length > 0) {
      report += `## Issues\n\n`;

      for (const warning of results.warnings) {
        report += `### ${warning.endpoint}\n\n`;
        for (const issue of warning.issues) {
          report += `- ${issue}\n`;
        }
        report += `\n`;
      }
    }

    await fs.writeFile(
      path.join(CONFIG.OUTPUT_DIR, 'validation-report.md'),
      report
    );
  }

  /**
   * Create example endpoints when functions directory doesn't exist
   */
  createExampleEndpoints() {
    this.endpoints = [
      {
        route: '/api/mlb/standings',
        methods: ['GET'],
        file: 'api/mlb/standings.js',
        description: 'Get current MLB standings by division',
        summary: 'MLB Standings',
        tags: ['MLB'],
        parameters: [
          {
            name: 'division',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filter by division (AL East, NL West, etc.)'
          }
        ],
        examples: {
          curl: `curl -X GET "${CONFIG.BASE_URL}/api/mlb/standings"`,
          javascript: `fetch('${CONFIG.BASE_URL}/api/mlb/standings')\n  .then(res => res.json())\n  .then(data => console.log(data));`
        },
        completeness: { hasDescription: true, hasParameters: true, hasExamples: true },
        completenessScore: 100
      }
    ];
  }

  /**
   * Convert string to camelCase
   */
  toCamelCase(str) {
    return str.replace(/[:-](\w)/g, (_, c) => c.toUpperCase());
  }

  /**
   * Convert string to snake_case
   */
  toSnakeCase(str) {
    return str.replace(/[:-]/g, '_').toLowerCase();
  }

  /**
   * Generate unique check ID
   */
  generateCheckId() {
    return `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Run generator if executed directly
if (require.main === module) {
  const generator = new APIDocGenerator();
  generator.generate().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { APIDocGenerator, CONFIG };
