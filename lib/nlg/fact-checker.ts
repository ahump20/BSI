/**
 * Fact Checker for NLG Content
 *
 * Validates generated content claims against database records
 */

import type { GameContext, FactCheckResult } from '../../workers/content/types';
import type { PrismaClient } from '@prisma/client';

export class FactChecker {
  private prisma: PrismaClient;
  private context: GameContext;

  constructor(prisma: PrismaClient, context: GameContext) {
    this.prisma = prisma;
    this.context = context;
  }

  /**
   * Extract verifiable claims from generated content
   */
  private extractClaims(content: string): string[] {
    const claims: string[] = [];

    // Extract score mentions (e.g., "won 5-3", "defeated 7-2")
    const scorePattern = /(?:won|lost|defeated|beat)\s+(\d+)-(\d+)/gi;
    let match;
    while ((match = scorePattern.exec(content)) !== null) {
      claims.push(`Score: ${match[1]}-${match[2]}`);
    }

    // Extract statistical lines (e.g., "3-4 with 2 RBI", "7 IP, 2 ER, 10 K")
    const battingPattern = /(\d+)-(\d+)(?:\s+with\s+(\d+)\s+RBI)?/g;
    while ((match = battingPattern.exec(content)) !== null) {
      claims.push(`Batting line: ${match[0]}`);
    }

    const pitchingPattern = /(\d+\.?\d*)\s+IP,?\s+(\d+)\s+ER,?\s+(\d+)\s+K/g;
    while ((match = pitchingPattern.exec(content)) !== null) {
      claims.push(`Pitching line: ${match[0]}`);
    }

    // Extract record mentions (e.g., "improved to 25-10", "dropped to 18-15")
    const recordPattern = /(?:improved|dropped|moved|fell)\s+to\s+(\d+)-(\d+)/gi;
    while ((match = recordPattern.exec(content)) !== null) {
      claims.push(`Record: ${match[1]}-${match[2]}`);
    }

    // Extract player names mentioned with stats
    const playerMentionPattern = /([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(?:went|had|pitched|threw|hit)/g;
    while ((match = playerMentionPattern.exec(content)) !== null) {
      claims.push(`Player mentioned: ${match[1]}`);
    }

    return claims;
  }

  /**
   * Verify score claim against game context
   */
  private async verifyScore(claim: string): Promise<FactCheckResult> {
    const scoreMatch = claim.match(/Score:\s+(\d+)-(\d+)/);
    if (!scoreMatch) {
      return {
        claim,
        verified: false,
        source: 'database',
        confidence: 0,
        correction: 'Unable to parse score claim',
      };
    }

    const [_, score1Str, score2Str] = scoreMatch;
    const score1 = parseInt(score1Str);
    const score2 = parseInt(score2Str);

    const { homeScore, awayScore } = this.context.game;

    // Check if scores match in either order (home/away or away/home)
    const matchesCorrectOrder = homeScore === score1 && awayScore === score2;
    const matchesReverseOrder = homeScore === score2 && awayScore === score1;

    if (matchesCorrectOrder || matchesReverseOrder) {
      return {
        claim,
        verified: true,
        source: 'database',
        confidence: 1.0,
      };
    }

    return {
      claim,
      verified: false,
      source: 'database',
      confidence: 0,
      correction: `Actual score: ${this.context.homeTeam.name} ${homeScore}, ${this.context.awayTeam.name} ${awayScore}`,
    };
  }

  /**
   * Verify record claim against team context
   */
  private async verifyRecord(claim: string): Promise<FactCheckResult> {
    const recordMatch = claim.match(/Record:\s+(\d+)-(\d+)/);
    if (!recordMatch) {
      return {
        claim,
        verified: false,
        source: 'database',
        confidence: 0,
        correction: 'Unable to parse record claim',
      };
    }

    const claimedRecord = `${recordMatch[1]}-${recordMatch[2]}`;

    // Check against both team records
    const homeRecordMatches = this.context.homeTeam.record === claimedRecord;
    const awayRecordMatches = this.context.awayTeam.record === claimedRecord;

    if (homeRecordMatches || awayRecordMatches) {
      return {
        claim,
        verified: true,
        source: 'database',
        confidence: 1.0,
      };
    }

    return {
      claim,
      verified: false,
      source: 'database',
      confidence: 0,
      correction: `Actual records: ${this.context.homeTeam.name} ${this.context.homeTeam.record}, ${this.context.awayTeam.name} ${this.context.awayTeam.record}`,
    };
  }

  /**
   * Verify player mention against game box score
   */
  private async verifyPlayerMention(claim: string): Promise<FactCheckResult> {
    const playerNameMatch = claim.match(/Player mentioned:\s+(.+)/);
    if (!playerNameMatch) {
      return {
        claim,
        verified: false,
        source: 'database',
        confidence: 0,
        correction: 'Unable to parse player name',
      };
    }

    const playerName = playerNameMatch[1];

    // Check if player is in top performers
    const { topPerformers } = this.context;
    if (!topPerformers) {
      return {
        claim,
        verified: false,
        source: 'database',
        confidence: 0,
        correction: 'No top performers data available',
      };
    }

    const allPerformers = [...(topPerformers.hitting || []), ...(topPerformers.pitching || [])];

    const playerFound = allPerformers.some(
      (p) =>
        p.playerName.toLowerCase().includes(playerName.toLowerCase()) ||
        playerName.toLowerCase().includes(p.playerName.toLowerCase())
    );

    if (playerFound) {
      return {
        claim,
        verified: true,
        source: 'database',
        confidence: 0.9, // Slightly lower confidence due to name matching
      };
    }

    // If not in top performers, check full roster via database
    try {
      const game = await this.prisma.game.findUnique({
        where: { id: this.context.game.id },
        include: {
          homeTeam: {
            include: {
              players: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
          awayTeam: {
            include: {
              players: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
        },
      });

      if (!game) {
        return {
          claim,
          verified: false,
          source: 'database',
          confidence: 0,
          correction: 'Game not found in database',
        };
      }

      const allPlayers = [...(game.homeTeam.players || []), ...(game.awayTeam.players || [])];

      const fullName = playerName.toLowerCase();
      const rosterMatch = allPlayers.some((p) => {
        const dbFullName = `${p.firstName} ${p.lastName}`.toLowerCase();
        return dbFullName.includes(fullName) || fullName.includes(dbFullName);
      });

      if (rosterMatch) {
        return {
          claim,
          verified: true,
          source: 'database',
          confidence: 0.8, // Lower confidence - player on roster but not in box
        };
      }

      return {
        claim,
        verified: false,
        source: 'database',
        confidence: 0,
        correction: `Player "${playerName}" not found on either roster`,
      };
    } catch (error) {
      console.error('[FactChecker] Error verifying player mention:', error);
      return {
        claim,
        verified: false,
        source: 'database',
        confidence: 0,
        correction: 'Database error during verification',
      };
    }
  }

  /**
   * Verify all extractable claims in content
   */
  async verifyContent(content: string): Promise<FactCheckResult[]> {
    const claims = this.extractClaims(content);
    const results: FactCheckResult[] = [];

    for (const claim of claims) {
      if (claim.startsWith('Score:')) {
        results.push(await this.verifyScore(claim));
      } else if (claim.startsWith('Record:')) {
        results.push(await this.verifyRecord(claim));
      } else if (claim.startsWith('Player mentioned:')) {
        results.push(await this.verifyPlayerMention(claim));
      } else if (claim.startsWith('Batting line:') || claim.startsWith('Pitching line:')) {
        // These require box score line item verification - complex
        // For now, mark as manual verification needed
        results.push({
          claim,
          verified: false,
          source: 'manual',
          confidence: 0.5,
          correction: 'Statistical line requires manual box score verification',
        });
      }
    }

    return results;
  }

  /**
   * Calculate overall content verification score
   */
  calculateVerificationScore(results: FactCheckResult[]): {
    overallScore: number;
    verifiedCount: number;
    failedCount: number;
    manualReviewCount: number;
  } {
    if (results.length === 0) {
      return {
        overallScore: 0,
        verifiedCount: 0,
        failedCount: 0,
        manualReviewCount: 0,
      };
    }

    const verifiedCount = results.filter((r) => r.verified && r.confidence >= 0.8).length;
    const failedCount = results.filter((r) => !r.verified && r.confidence < 0.5).length;
    const manualReviewCount = results.filter((r) => r.source === 'manual').length;

    // Calculate weighted score
    const totalConfidence = results.reduce((sum, r) => sum + (r.verified ? r.confidence : 0), 0);
    const overallScore = totalConfidence / results.length;

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      verifiedCount,
      failedCount,
      manualReviewCount,
    };
  }
}
