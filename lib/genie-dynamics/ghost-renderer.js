/**
 * Ghost Renderer — Canvas 2D ghost overlay
 * Renders predicted future states as semi-transparent ghosts with probability halos.
 *
 * v2: evidence-aware halo gating (minObservations, haloThreshold config).
 */

import { decode, AgentType, ActionState } from './state-tokenizer.js';

const COLORS = {
  burnt_orange: '#BF5700',
  ghost_blue: 'rgba(100, 149, 237, 0.4)',
  anomaly_red: 'rgba(255, 59, 48, 0.6)',
  confidence_green: 'rgba(52, 199, 89, 0.3)',
};

const TYPE_COLORS = {
  [AgentType.IDLE]: '#6B7280',
  [AgentType.ANALYST]: '#3B82F6',
  [AgentType.FETCHER]: '#8B5CF6',
  [AgentType.WRITER]: '#10B981',
  [AgentType.REVIEWER]: '#F59E0B',
  [AgentType.BLOCKED]: '#EF4444',
  [AgentType.COMPLETE]: '#22C55E',
  [AgentType.ERROR]: '#DC2626',
};

export class GhostRenderer {
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = {
      opacity: config.opacity ?? 0.3,
      minProbability: config.minProbability ?? 0.1,
      minObservations: config.minObservations ?? 5,
      haloThreshold: config.haloThreshold ?? 0.3,
      showProbabilityHalo: config.showProbabilityHalo ?? true,
      showAnomalies: config.showAnomalies ?? true,
    };
    this.ghosts = [];
    this.anomalies = new Map();
    this.gridWidth = 4;
    this.gridHeight = 4;
  }

  setMapDimensions(width, height) {
    this.gridWidth = width;
    this.gridHeight = height;
  }

  updateGhosts(agentPredictions) {
    this.ghosts = [];
    for (const [agentId, data] of agentPredictions) {
      const { predictions } = data;
      for (const pred of predictions) {
        if (pred.token == null) continue; // null safety
        if (pred.probability < this.config.minProbability) continue;
        if ((pred.observations ?? 0) < this.config.minObservations) continue;
        const state = decode(pred.token);
        const pos = this._regionToPosition(state.region);
        this.ghosts.push({
          agentId, x: pos.x, y: pos.y, token: pred.token,
          probability: pred.probability, observations: pred.observations ?? 0,
          color: this._getGhostColor(state),
          opacity: this.config.opacity * pred.probability, state,
        });
      }
    }
  }

  recordAnomaly(agentId, score) {
    if (score > 0.5) {
      this.anomalies.set(agentId, { score, time: Date.now() });
    }
    const now = Date.now();
    for (const [id, data] of this.anomalies) {
      if (now - data.time > 3000) {
        this.anomalies.delete(id);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    for (const ghost of this.ghosts) {
      this._renderGhost(ghost, width, height);
    }
    if (this.config.showAnomalies) {
      for (const [agentId, data] of this.anomalies) {
        this._renderAnomalyIndicator(agentId, data.score);
      }
    }
  }

  _renderGhost(ghost, canvasWidth, canvasHeight) {
    const ctx = this.ctx;
    const x = ghost.x * canvasWidth;
    const y = ghost.y * canvasHeight;
    const radius = 12;
    ctx.save();
    ctx.globalAlpha = ghost.opacity;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = ghost.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (
      this.config.showProbabilityHalo &&
      ghost.probability >= this.config.haloThreshold &&
      ghost.observations >= this.config.minObservations
    ) {
      const haloRadius = radius + 8 + (ghost.probability * 10);
      ctx.beginPath();
      ctx.arc(x, y, haloRadius, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.confidence_green;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 6]);
      ctx.stroke();
    }

    this._renderActionIndicator(x, y - radius - 6, ghost.state.action, ghost.opacity);
    ctx.restore();
  }

  _renderActionIndicator(x, y, action, opacity) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = opacity * 0.8;
    ctx.font = '10px monospace';
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    const icons = {
      [ActionState.IDLE]: '\u25CB',
      [ActionState.READING]: '\u25D0',
      [ActionState.WRITING]: '\u270E',
      [ActionState.WAITING]: '\u25F7',
      [ActionState.EXECUTING]: '\u25B6',
      [ActionState.COMMUNICATING]: '\u25C8',
      [ActionState.THINKING]: '\u25C9',
      [ActionState.DONE]: '\u2713',
    };
    ctx.fillText(icons[action] || '?', x, y);
    ctx.restore();
  }

  _renderAnomalyIndicator(agentId, score) {
    const ghost = this.ghosts.find(g => g.agentId === agentId);
    if (!ghost) return;
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    const x = ghost.x * width;
    const y = ghost.y * height;
    ctx.save();
    ctx.globalAlpha = score * 0.6;

    const time = Date.now() / 500;
    const pulse = 1 + Math.sin(time) * 0.2;
    const radius = 20 * pulse;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.anomaly_red;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = COLORS.anomaly_red;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', x, y - radius - 4);
    ctx.restore();
  }

  _regionToPosition(region) {
    const gridX = region % 4;
    const gridY = Math.floor(region / 4);
    return { x: (gridX + 0.5) / 4, y: (gridY + 0.5) / 4 };
  }

  _getGhostColor(state) {
    return TYPE_COLORS[state.type] || COLORS.ghost_blue;
  }

  clear() {
    this.ghosts = [];
    this.anomalies.clear();
  }
}

export default GhostRenderer;
