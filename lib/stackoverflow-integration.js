#!/usr/bin/env node

/**
 * Stack Overflow Integration for Blaze Sports Intel
 * Provides community-driven support and documentation
 */

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

class StackOverflowIntegration {
  constructor(options = {}) {
    this.apiUrl = 'https://api.stackexchange.com/2.3';
    this.site = 'stackoverflow';
    this.userAgent = 'Blaze Sports Intel API Integration';
    this.tags = options.tags || [
      'sports-analytics',
      'biomechanics',
      'computer-vision',
      'machine-learning',
    ];
    this.cacheDir = options.cacheDir || './cache/stackoverflow';
  }

  /**
   * Search for questions related to Blaze Sports Intel topics
   */
  async searchQuestions(query, options = {}) {
    const params = new URLSearchParams({
      order: options.order || 'desc',
      sort: options.sort || 'relevance',
      intitle: query,
      site: this.site,
      tagged: this.tags.join(';'),
      pagesize: options.limit || 10,
      filter: 'withbody',
    });

    try {
      const response = await fetch(`${this.apiUrl}/search/advanced?${params}`, {
        headers: {
          'User-Agent': this.userAgent,
        },
      });

      const data = await response.json();

      if (data.error_id) {
        throw new Error(`Stack Overflow API Error: ${data.error_message}`);
      }

      return {
        questions: data.items.map((item) => ({
          id: item.question_id,
          title: item.title,
          body: item.body,
          score: item.score,
          view_count: item.view_count,
          answer_count: item.answer_count,
          tags: item.tags,
          creation_date: new Date(item.creation_date * 1000),
          last_activity_date: new Date(item.last_activity_date * 1000),
          link: item.link,
          is_answered: item.is_answered,
          accepted_answer_id: item.accepted_answer_id,
        })),
        has_more: data.has_more,
        quota_max: data.quota_max,
        quota_remaining: data.quota_remaining,
      };
    } catch (error) {
      console.error('Error searching Stack Overflow:', error);
      throw error;
    }
  }

  /**
   * Get answers for a specific question
   */
  async getAnswers(questionId, options = {}) {
    const params = new URLSearchParams({
      order: options.order || 'desc',
      sort: options.sort || 'votes',
      site: this.site,
      filter: 'withbody',
    });

    try {
      const response = await fetch(`${this.apiUrl}/questions/${questionId}/answers?${params}`, {
        headers: {
          'User-Agent': this.userAgent,
        },
      });

      const data = await response.json();

      if (data.error_id) {
        throw new Error(`Stack Overflow API Error: ${data.error_message}`);
      }

      return {
        answers: data.items.map((item) => ({
          id: item.answer_id,
          question_id: item.question_id,
          body: item.body,
          score: item.score,
          is_accepted: item.is_accepted,
          creation_date: new Date(item.creation_date * 1000),
          last_activity_date: new Date(item.last_activity_date * 1000),
          owner: item.owner,
        })),
        has_more: data.has_more,
      };
    } catch (error) {
      console.error('Error fetching answers:', error);
      throw error;
    }
  }

  /**
   * Generate FAQ from popular Stack Overflow questions
   */
  async generateFAQ(topics = []) {
    const faqData = {
      generated_at: new Date().toISOString(),
      topics: [],
      total_questions: 0,
    };

    const searchTopics =
      topics.length > 0
        ? topics
        : [
            'pose estimation',
            'biomechanics analysis',
            'sports analytics',
            'machine learning sports',
            '3d pose tracking',
            'computer vision sports',
          ];

    for (const topic of searchTopics) {
      try {
        const results = await this.searchQuestions(topic, { limit: 5 });

        const topicData = {
          topic,
          question_count: results.questions.length,
          questions: results.questions.map((q) => ({
            title: q.title,
            link: q.link,
            score: q.score,
            answer_count: q.answer_count,
            is_answered: q.is_answered,
            tags: q.tags,
            summary: this.extractSummary(q.body),
          })),
        };

        faqData.topics.push(topicData);
        faqData.total_questions += results.questions.length;

        // Rate limiting - Stack Overflow API has limits
        await this.delay(100);
      } catch (error) {
        console.warn(`Failed to fetch data for topic "${topic}":`, error.message);
      }
    }

    return faqData;
  }

  /**
   * Extract summary from HTML body content
   */
  extractSummary(htmlBody, maxLength = 200) {
    if (!htmlBody) return 'No summary available';

    // Remove HTML tags and get plain text
    const plainText = htmlBody
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (plainText.length <= maxLength) {
      return plainText;
    }

    return plainText.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
  }

  /**
   * Cache FAQ data locally
   */
  async cacheFAQ(faqData, filename = 'stackoverflow-faq.json') {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      const filePath = path.join(this.cacheDir, filename);
      await fs.writeFile(filePath, JSON.stringify(faqData, null, 2));
    } catch (error) {
      console.error('Error caching FAQ:', error);
    }
  }

  /**
   * Generate markdown documentation from FAQ
   */
  async generateMarkdownFAQ(faqData) {
    const markdown = [
      '# 📚 Community FAQ - Stack Overflow Integration',
      '',
      `*Generated on ${new Date(faqData.generated_at).toLocaleDateString()}*`,
      '',
      `This FAQ compiles popular questions and answers from Stack Overflow related to sports analytics, biomechanics, and computer vision. Total questions analyzed: **${faqData.total_questions}**`,
      '',
      '## Topics Covered',
      '',
    ];

    // Table of contents
    faqData.topics.forEach((topic, index) => {
      markdown.push(
        `${index + 1}. [${topic.topic}](#${topic.topic.toLowerCase().replace(/\s+/g, '-')})`
      );
    });

    markdown.push('', '---', '');

    // Detailed sections
    faqData.topics.forEach((topic) => {
      markdown.push(`## ${topic.topic}`);
      markdown.push('');
      markdown.push(`Found **${topic.question_count}** relevant questions on Stack Overflow:`);
      markdown.push('');

      topic.questions.forEach((question, index) => {
        markdown.push(`### ${index + 1}. ${question.title}`);
        markdown.push('');
        markdown.push(
          `**Score:** ${question.score} | **Answers:** ${question.answer_count} | **Status:** ${question.is_answered ? '✅ Answered' : '❓ Open'}`
        );
        markdown.push('');
        markdown.push(`**Tags:** ${question.tags.map((tag) => `\`${tag}\``).join(', ')}`);
        markdown.push('');
        markdown.push(`**Summary:** ${question.summary}`);
        markdown.push('');
        markdown.push(`🔗 [View on Stack Overflow](${question.link})`);
        markdown.push('');
        markdown.push('---');
        markdown.push('');
      });
    });

    markdown.push(
      '## Contributing',
      '',
      'Found a relevant question not covered here? Help improve our community knowledge:',
      '',
      '1. Search [Stack Overflow](https://stackoverflow.com) for your topic',
      '2. Tag questions with relevant terms: `sports-analytics`, `biomechanics`, `computer-vision`',
      '3. Submit high-quality questions and answers',
      '4. Reference this project in your questions when appropriate',
      '',
      '## Disclaimer',
      '',
      "This FAQ is automatically generated from Stack Overflow content using their public API. All questions and answers are subject to Stack Overflow's terms of service and licensing.",
      ''
    );

    return markdown.join('\n');
  }

  /**
   * Utility method for rate limiting
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get quota information
   */
  async getQuotaInfo() {
    try {
      const response = await fetch(`${this.apiUrl}/info?site=${this.site}`, {
        headers: {
          'User-Agent': this.userAgent,
        },
      });

      const data = await response.json();
      return {
        quota_max: data.quota_max,
        quota_remaining: data.quota_remaining,
      };
    } catch (error) {
      console.error('Error getting quota info:', error);
      return null;
    }
  }
}

export default StackOverflowIntegration;

// CLI usage (guarded for Workers compatibility)
if (
  typeof process !== 'undefined' &&
  process.argv && // @workers-compat-ignore - inside typeof guard
  import.meta.url === `file://${process.argv[1]}` // @workers-compat-ignore - inside typeof guard
) {
  const integration = new StackOverflowIntegration();

  // Main entry point for CLI execution
  const main = async () => {
    try {
      const faq = await integration.generateFAQ();
      await integration.cacheFAQ(faq);

      const markdown = await integration.generateMarkdownFAQ(faq);
      await fs.writeFile('./docs/STACKOVERFLOW_FAQ.md', markdown);

      // Get quota info (result logged in getQuotaInfo if available)
      await integration.getQuotaInfo();
    } catch (error) {
      console.error('❌ Error generating FAQ:', error);
      process.exit(1); // @workers-compat-ignore - inside typeof guard
    }
  };

  main();
}
