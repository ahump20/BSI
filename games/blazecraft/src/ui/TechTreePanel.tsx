/**
 * TechTreePanel - Tech tree visualization and unlock interface
 *
 * Shows three branches (Analytics, Reputation, Operations) with
 * 3 tiers each. Allows unlocking nodes when resources are available.
 */

import React, { useState } from 'react';
import type { Resources } from '@core/ResourceSystem';
import {
  TechTree,
  TechNode,
  TechBranch,
  TechNodeId,
  TECH_NODES,
  BRANCH_CONFIG,
  getTechTreeLayout,
  formatTechCost,
} from '@core/TechTree';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface TechTreePanelProps {
  techTree: TechTree;
  resources: Resources;
  onUnlock: (nodeId: TechNodeId) => void;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  panel: {
    width: '900px',
    maxWidth: '95vw',
    maxHeight: '90vh',
    background: '#1A1A1A',
    borderRadius: '8px',
    border: '1px solid #333',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #333',
    background: '#0D0D0D',
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#F5F5DC',
    letterSpacing: '0.05em',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
  },
  content: {
    flex: 1,
    padding: '1.5rem',
    overflow: 'auto',
  },
  branches: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1.5rem',
  },
  branch: {
    background: '#0D0D0D',
    borderRadius: '8px',
    border: '1px solid #333',
    padding: '1rem',
  },
  branchHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid #333',
  },
  branchIcon: {
    fontSize: '1.2rem',
  },
  branchName: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#F5F5DC',
  },
  branchDesc: {
    fontSize: '0.65rem',
    color: '#888',
  },
  nodes: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  node: {
    padding: '0.75rem',
    borderRadius: '6px',
    border: '2px solid #333',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  nodeUnlocked: {
    background: 'rgba(46, 204, 113, 0.1)',
    borderColor: '#2ECC71',
  },
  nodeAvailable: {
    background: 'rgba(191, 87, 0, 0.1)',
    borderColor: '#BF5700',
  },
  nodeLocked: {
    background: '#1A1A1A',
    borderColor: '#333',
    opacity: 0.6,
  },
  nodeCanAfford: {
    borderColor: '#F1C40F',
  },
  nodeTier: {
    fontSize: '0.55rem',
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    marginBottom: '0.25rem',
  },
  nodeName: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#F5F5DC',
    marginBottom: '0.25rem',
  },
  nodeDesc: {
    fontSize: '0.7rem',
    color: '#AAA',
    lineHeight: 1.4,
    marginBottom: '0.5rem',
  },
  nodeCost: {
    fontSize: '0.7rem',
    fontWeight: 600,
    padding: '0.2rem 0.5rem',
    borderRadius: '3px',
    display: 'inline-block',
  },
  nodeStatus: {
    fontSize: '0.65rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  },
  connector: {
    width: '2px',
    height: '12px',
    background: '#333',
    margin: '0 auto',
  },
  connectorActive: {
    background: '#2ECC71',
  },
  tooltip: {
    position: 'absolute' as const,
    background: '#0D0D0D',
    border: '1px solid #555',
    borderRadius: '6px',
    padding: '0.75rem',
    maxWidth: '250px',
    zIndex: 1001,
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
  },
  tooltipTitle: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#F5F5DC',
    marginBottom: '0.5rem',
  },
  tooltipEffect: {
    fontSize: '0.75rem',
    color: '#2ECC71',
    marginBottom: '0.5rem',
    padding: '0.5rem',
    background: 'rgba(46, 204, 113, 0.1)',
    borderRadius: '4px',
  },
};

// ─────────────────────────────────────────────────────────────
// Branch Icons
// ─────────────────────────────────────────────────────────────

const BRANCH_ICONS: Record<TechBranch, string> = {
  analytics: '📊',
  reputation: '🌟',
  operations: '⚙️',
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function TechTreePanel({
  techTree,
  resources,
  onUnlock,
  onClose,
}: TechTreePanelProps): React.ReactElement {
  const [selectedNode, setSelectedNode] = useState<TechNodeId | null>(null);
  const layout = getTechTreeLayout();

  function getNodeStyle(node: TechNode): React.CSSProperties {
    const isUnlocked = techTree.isUnlocked(node.id);
    const canUnlock = techTree.canUnlock(node.id, resources);
    const prereqMet = !node.requires || techTree.isUnlocked(node.requires);

    if (isUnlocked) {
      return { ...styles.node, ...styles.nodeUnlocked };
    }
    if (canUnlock) {
      return { ...styles.node, ...styles.nodeAvailable, ...styles.nodeCanAfford };
    }
    if (prereqMet) {
      return { ...styles.node, ...styles.nodeAvailable };
    }
    return { ...styles.node, ...styles.nodeLocked };
  }

  function handleNodeClick(node: TechNode): void {
    if (techTree.isUnlocked(node.id)) {
      setSelectedNode(node.id);
      return;
    }
    if (techTree.canUnlock(node.id, resources)) {
      onUnlock(node.id);
    }
  }

  function renderNode(node: TechNode, index: number): React.ReactNode {
    const isUnlocked = techTree.isUnlocked(node.id);
    const canUnlock = techTree.canUnlock(node.id, resources);
    const prereqMet = !node.requires || techTree.isUnlocked(node.requires);
    const config = BRANCH_CONFIG[node.branch];

    return (
      <React.Fragment key={node.id}>
        {index > 0 && (
          <div
            style={{
              ...styles.connector,
              ...(techTree.isUnlocked(layout[node.branch][index - 1].id)
                ? styles.connectorActive
                : {}),
            }}
          />
        )}
        <div
          style={getNodeStyle(node)}
          onClick={() => handleNodeClick(node)}
          title={node.effect.description}
        >
          <div style={styles.nodeTier}>Tier {node.tier}</div>
          <div style={styles.nodeName}>{node.name}</div>
          <div style={styles.nodeDesc}>{node.description}</div>
          {isUnlocked ? (
            <span style={{ ...styles.nodeStatus, color: '#2ECC71' }}>✓ Unlocked</span>
          ) : prereqMet ? (
            <span
              style={{
                ...styles.nodeCost,
                background: canUnlock
                  ? 'rgba(241, 196, 15, 0.2)'
                  : 'rgba(136, 136, 136, 0.2)',
                color: canUnlock ? '#F1C40F' : '#888',
              }}
            >
              {formatTechCost(node.cost)}
            </span>
          ) : (
            <span style={{ ...styles.nodeStatus, color: '#888' }}>
              Requires: {TECH_NODES[node.requires!]?.name}
            </span>
          )}
        </div>
      </React.Fragment>
    );
  }

  return (
    <div id="tech-tree-panel" style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.title}>Tech Tree</div>
          <button
            style={styles.closeButton}
            onClick={onClose}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#F5F5DC')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#888')}
          >
            ✕
          </button>
        </div>

        <div style={styles.content}>
          <div style={styles.branches}>
            {(['analytics', 'reputation', 'operations'] as TechBranch[]).map((branch) => {
              const config = BRANCH_CONFIG[branch];
              const nodes = layout[branch];

              return (
                <div
                  key={branch}
                  style={{
                    ...styles.branch,
                    borderColor: `${config.color}33`,
                  }}
                >
                  <div style={styles.branchHeader}>
                    <span style={styles.branchIcon}>{BRANCH_ICONS[branch]}</span>
                    <div>
                      <div style={{ ...styles.branchName, color: config.color }}>
                        {config.name}
                      </div>
                      <div style={styles.branchDesc}>{config.description}</div>
                    </div>
                  </div>
                  <div style={styles.nodes}>
                    {nodes.map((node, i) => renderNode(node, i))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TechTreePanel;
