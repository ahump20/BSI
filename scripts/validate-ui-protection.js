#!/usr/bin/env node

/**
 * UI Protection Validation Script
 * Ensures UI files are not modified inappropriately
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Protected UI files
const PROTECTED_UI_FILES = [
  'index.html',
  'css/blaze-revolutionary-command-center.css',
  'css/blaze-ultimate-aesthetics.css',
  'js/blaze-revolutionary-command-center.js',
  'js/blaze-ultimate-visual-engine.js',
  'apps/web/app/page.tsx',
  'apps/web/app/globals.css'
];

// Protected brand colors
const PROTECTED_COLORS = [
  '#1a1a1a', // Primary dark
  '#ff6b00', // Secondary orange
  '#0066cc', // Accent blue
  '#2d2d2d', // Background gray
  '#ffffff'  // Text white
];

// Context7 tools directory
const CONTEXT7_TOOLS_DIR = path.join(projectRoot, 'context7-enhanced', 'src', 'tools');

class UIProtectionValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  validateContext7Tools() {
    console.log('🔍 Validating Context7 tools...');
    
    if (!fs.existsSync(CONTEXT7_TOOLS_DIR)) {
      this.errors.push('Context7 tools directory not found');
      return;
    }

    const toolFiles = fs.readdirSync(CONTEXT7_TOOLS_DIR)
      .filter(file => file.endsWith('.ts'))
      .map(file => path.join(CONTEXT7_TOOLS_DIR, file));

    for (const toolFile of toolFiles) {
      this.validateToolFile(toolFile);
    }
  }

  validateToolFile(toolFile) {
    const content = fs.readFileSync(toolFile, 'utf8');
    const fileName = path.basename(toolFile);

    // Check for UI references
    for (const uiFile of PROTECTED_UI_FILES) {
      if (content.includes(uiFile)) {
        this.errors.push(`${fileName}: References UI file ${uiFile}`);
      }
    }

    // Check for hardcoded brand colors
    for (const color of PROTECTED_COLORS) {
      if (content.includes(color)) {
        this.errors.push(`${fileName}: Contains hardcoded brand color ${color}`);
      }
    }

    // Check for UI manipulation code
    const uiPatterns = [
      /innerHTML|outerHTML/,
      /appendChild|removeChild/,
      /createElement/,
      /style\./,
      /classList\./,
      /setAttribute/,
      /addEventListener/,
      /document\.|window\.|DOM/
    ];

    for (const pattern of uiPatterns) {
      if (pattern.test(content)) {
        this.errors.push(`${fileName}: Contains UI manipulation code`);
        break;
      }
    }

    // Check for proper Zod usage
    const zodImportRegex = /import\s+.*\s+from\s+['"]zod['"]/;
    if (!zodImportRegex.test(content)) {
      this.errors.push(`${fileName}: Missing Zod imports`);
    }

    if (!content.includes('export const tools')) {
      this.errors.push(`${fileName}: Missing tools export`);
    }

    // Check for proper MCP integration
    if (!content.includes('inputSchema') || !content.includes('outputSchema')) {
      this.errors.push(`${fileName}: Missing MCP schema definitions`);
    }
  }

  validateUIFiles() {
    console.log('🎨 Validating UI files...');

    for (const uiFile of PROTECTED_UI_FILES) {
      const filePath = path.join(projectRoot, uiFile);
      
      if (!fs.existsSync(filePath)) {
        this.warnings.push(`UI file not found: ${uiFile}`);
        continue;
      }

      this.validateUIFile(filePath, uiFile);
    }
  }

  validateUIFile(filePath, fileName) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check for brand color integrity
    if (fileName.endsWith('.css') || fileName.endsWith('.html')) {
      for (const color of PROTECTED_COLORS) {
        if (content.includes(color)) {
          console.log(`✅ ${fileName}: Contains brand color ${color}`);
        }
      }
    }

    // Check for proper HTML structure
    if (fileName.endsWith('.html')) {
      if (!content.includes('<!DOCTYPE html>')) {
        this.errors.push(`${fileName}: Missing DOCTYPE declaration`);
      }
      
      const htmlLangRegex = /<html[^>]*\blang\s*=\s*["'][^"']+["']/i;
      if (!htmlLangRegex.test(content)) {
        this.errors.push(`${fileName}: Missing lang attribute in <html> tag`);
      }
    }

    // Check for proper CSS structure
    if (fileName.endsWith('.css')) {
      if (!content.includes('.blaze-') && !content.includes('brand-')) {
        this.warnings.push(`${fileName}: No Blaze-specific classes found`);
      }
    }
  }

  validateContext7Integration() {
    console.log('🔗 Validating Context7 integration...');

    const context7JsonPath = path.join(projectRoot, 'context7.json');
    if (!fs.existsSync(context7JsonPath)) {
      this.errors.push('context7.json not found');
      return;
    }

    const context7Config = JSON.parse(fs.readFileSync(context7JsonPath, 'utf8'));

    // Check for UI protection rules
    const rules = context7Config.rules || [];
    const hasUIRules = rules.some(rule => rule.includes('UI PROTECTION'));
    
    if (!hasUIRules) {
      this.errors.push('context7.json missing UI protection rules');
    }

    // Check for proper project structure
    if (!context7Config.folders || context7Config.folders.length === 0) {
      this.errors.push('context7.json missing folder configuration');
    }
  }

  validateBrandConsistency() {
    console.log('🎨 Validating brand consistency...');

    let brandColorCounts = {};
    
    for (const color of PROTECTED_COLORS) {
      brandColorCounts[color] = 0;
    }

    // Count brand color usage across all files
    const allFiles = this.getAllProjectFiles();
    
    for (const file of allFiles) {
      if (file.endsWith('.html') || file.endsWith('.css') || file.endsWith('.js')) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          for (const color of PROTECTED_COLORS) {
            const matches = (content.match(new RegExp(color.replace('#', '\\#'), 'g')) || []).length;
            brandColorCounts[color] += matches;
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }

    // Report brand color usage
    for (const [color, count] of Object.entries(brandColorCounts)) {
      if (count > 0) {
        console.log(`🎨 Brand color ${color}: ${count} occurrences`);
      } else {
        this.warnings.push(`Brand color ${color} not found in project`);
      }
    }
  }

  getAllProjectFiles() {
    const files = [];
    
    const scanDirectory = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDirectory(fullPath);
        } else if (stat.isFile()) {
          files.push(fullPath);
        }
      }
    };

    scanDirectory(projectRoot);
    return files;
  }

  run() {
    console.log('🛡️ Starting UI Protection Validation...\n');

    this.validateContext7Tools();
    this.validateUIFiles();
    this.validateContext7Integration();
    this.validateBrandConsistency();

    console.log('\n📊 Validation Results:');
    console.log(`❌ Errors: ${this.errors.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => console.log(`  - ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    if (this.errors.length === 0) {
      console.log('\n✅ UI Protection validation passed!');
      process.exit(0);
    } else {
      console.log('\n❌ UI Protection validation failed!');
      process.exit(1);
    }
  }
}

// Run validation
const validator = new UIProtectionValidator();
validator.run();