/**
 * Transfer Portal Heatmap Visualization
 * Interactive D3.js visualization of conference-to-conference movement
 *
 * Features:
 * - Force-directed graph showing portal flows
 * - Chord diagram for conference relationships
 * - Node size based on total entries
 * - Edge thickness based on transfer volume
 * - Color coding by conference strength
 * - Interactive hover tooltips
 * - Zoom and pan controls
 * - Animation on data updates
 *
 * Visualization Types:
 * - Force Graph: Shows directional flows between conferences
 * - Chord Diagram: Shows bidirectional relationships
 * - Matrix Heatmap: Shows raw transfer counts
 *
 * Integration Points:
 * - PortalTracker.tsx (parent component)
 * - API endpoint /api/recruiting/portal-activity
 * - D3.js v7 for visualization
 *
 * Data Sources: 247Sports, On3, Perfect Game aggregated data
 * Last Updated: October 19, 2025
 * Timezone: America/Chicago
 */

'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
// @ts-expect-error d3 types not installed - install @types/d3 for full type support
import * as d3 from 'd3';
import { logger } from '../../lib/utils/logger';
import { useWindowSize, useMobile } from '@/lib/hooks/useResponsive';

// ============================================================================
// Type Definitions
// ============================================================================

interface ConferenceNode {
  id: string;
  name: string;
  totalEntries: number;
  totalCommitments: number;
  avgNILValue: number;
  strength: number; // 1-10 scale
  color: string;
}

interface TransferFlow {
  source: string;
  target: string;
  count: number;
  avgNILDelta: number;
}

interface HeatmapData {
  nodes: ConferenceNode[];
  flows: TransferFlow[];
}

type VisualizationType = 'force' | 'chord' | 'matrix';

// ============================================================================
// Portal Heatmap Component
// ============================================================================

export function PortalHeatmap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null);
  const [data, setData] = useState<HeatmapData | null>(null);
  const [vizType, setVizType] = useState<VisualizationType>('force');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_selectedConference, setSelectedConference] = useState<string | null>(null);

  // Responsive dimensions
  const windowSize = useWindowSize();
  const isMobile = useMobile();

  // Calculate responsive dimensions based on container/viewport
  const dimensions = useMemo(() => {
    // Leave padding for container (48px on each side for desktop, 24px for mobile)
    const padding = isMobile ? 48 : 96;
    const maxWidth = Math.min(windowSize.width - padding, 1200);
    const width = Math.max(maxWidth, 320); // Minimum width for usability

    // Maintain aspect ratio, but allow more height on mobile for vertical scrolling
    const aspectRatio = isMobile ? 1.2 : 0.67; // 3:2 for desktop, taller for mobile
    const height = Math.min(Math.round(width * aspectRatio), 800);

    return { width, height };
  }, [windowSize.width, isMobile]);

  const { width, height } = dimensions;

  // ============================================================================
  // Data Fetching
  // ============================================================================

  useEffect(() => {
    fetchHeatmapData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchHeatmapData is stable, mount-only effect
  }, []);

  const fetchHeatmapData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/recruiting/portal-activity');
      if (!response.ok) throw new Error('Failed to fetch heatmap data');

      const result = await response.json();

      // Transform API data to heatmap format
      const heatmapData = transformToHeatmapData(result);
      setData(heatmapData);
    } catch (err) {
      logger.error({ component: 'PortalHeatmap', error: err }, 'Heatmap data fetch error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const transformToHeatmapData = (apiData: any): HeatmapData => {
    // Aggregate by conference
    const conferenceStats: Record<
      string,
      {
        entries: number;
        commits: number;
        nilValues: number[];
      }
    > = {};

    apiData.entries.forEach((entry: any) => {
      // Previous conference
      if (!conferenceStats[entry.previousConference]) {
        conferenceStats[entry.previousConference] = {
          entries: 0,
          commits: 0,
          nilValues: [],
        };
      }
      conferenceStats[entry.previousConference].entries++;
      if (entry.nilValuation) {
        conferenceStats[entry.previousConference].nilValues.push(entry.nilValuation.estimatedValue);
      }

      // New conference
      if (entry.newConference && entry.status === 'committed') {
        if (!conferenceStats[entry.newConference]) {
          conferenceStats[entry.newConference] = {
            entries: 0,
            commits: 0,
            nilValues: [],
          };
        }
        conferenceStats[entry.newConference].commits++;
      }
    });

    // Create nodes
    const nodes: ConferenceNode[] = Object.entries(conferenceStats).map(([conf, stats]) => {
      const avgNIL =
        stats.nilValues.length > 0
          ? stats.nilValues.reduce((sum, val) => sum + val, 0) / stats.nilValues.length
          : 0;

      return {
        id: conf,
        name: conf,
        totalEntries: stats.entries,
        totalCommitments: stats.commits,
        avgNILValue: Math.round(avgNIL),
        strength: getConferenceStrength(conf),
        color: getConferenceColor(conf),
      };
    });

    // Create flows from API conference flows
    const flows: TransferFlow[] = apiData.conferenceFlows.map((flow: any) => ({
      source: flow.from,
      target: flow.to,
      count: flow.count,
      avgNILDelta: flow.avgNILDelta,
    }));

    return { nodes, flows };
  };

  // ============================================================================
  // Visualization Rendering
  // ============================================================================

  useEffect(() => {
    if (!data || !svgRef.current) return;

    // Stop any existing simulation to prevent memory leaks
    if (simulationRef.current) {
      simulationRef.current.stop();
      simulationRef.current = null;
    }

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    // Render based on type
    if (vizType === 'force') {
      renderForceGraph(data);
    } else if (vizType === 'chord') {
      renderChordDiagram(data);
    } else if (vizType === 'matrix') {
      renderMatrixHeatmap(data);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- render functions are stable, depend on data/vizType/dimensions
  }, [data, vizType, width, height]);

  // ============================================================================
  // Force-Directed Graph
  // ============================================================================

  const renderForceGraph = (data: HeatmapData) => {
    const svg = d3.select(svgRef.current);

    // Deep clone nodes to avoid mutating original data
    const nodesCopy = data.nodes.map((n) => ({ ...n }));
    const flowsCopy = data.flows.map((f) => ({ ...f }));

    // Create simulation and store in ref for cleanup
    const simulation = d3.forceSimulation(nodesCopy as any);
    simulationRef.current = simulation;

    simulation
      .force(
        'link',
        d3
          .forceLink(flowsCopy)
          .id((d: any) => d.id)
          .distance(150)
          .strength(0.5)
      )
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));

    // Add zoom behavior
    const g = svg.append('g');
    svg.call(
      d3
        .zoom<SVGSVGElement, unknown>()
        .extent([
          [0, 0],
          [width, height],
        ])
        .scaleExtent([0.5, 4])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        }) as any
    );

    // Create arrow markers
    svg
      .append('defs')
      .selectAll('marker')
      .data(['end'])
      .enter()
      .append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#9ca3af');

    // Draw links
    const link = g
      .append('g')
      .selectAll('line')
      .data(flowsCopy)
      .enter()
      .append('line')
      .attr('stroke', '#9ca3af')
      .attr('stroke-width', (d: TransferFlow) => Math.sqrt(d.count) * 2)
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', 'url(#arrow)');

    // Draw nodes
    const node = g
      .append('g')
      .selectAll('g')
      .data(nodesCopy)
      .enter()
      .append('g')
      .call(
        d3
          .drag<SVGGElement, ConferenceNode>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended) as any
      );

    // Node circles
    node
      .append('circle')
      .attr('r', (d: ConferenceNode) => Math.sqrt(d.totalEntries) * 5 + 15)
      .attr('fill', (d: ConferenceNode) => d.color)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('opacity', 0.9)
      .on('mouseover', function (event, d) {
        d3.select(this).attr('opacity', 1).attr('stroke-width', 3);
        showTooltip(event, d);
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 0.9).attr('stroke-width', 2);
        hideTooltip();
      })
      .on('click', (event, d) => {
        setSelectedConference(d.id);
      });

    // Node labels
    node
      .append('text')
      .text((d: ConferenceNode) => d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#ffffff')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none');

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
  };

  // ============================================================================
  // Chord Diagram
  // ============================================================================

  const renderChordDiagram = (data: HeatmapData) => {
    const svg = d3.select(svgRef.current);
    const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);

    const outerRadius = Math.min(width, height) * 0.4;
    const innerRadius = outerRadius - 30;

    // Create matrix
    const nodeIndexMap = new Map<string, number>();
    data.nodes.forEach((node, i) => nodeIndexMap.set(node.id, i));

    const matrix: number[][] = Array(data.nodes.length)
      .fill(0)
      .map(() => Array(data.nodes.length).fill(0));

    data.flows.forEach((flow) => {
      const sourceIdx = nodeIndexMap.get(flow.source);
      const targetIdx = nodeIndexMap.get(flow.target);
      if (sourceIdx !== undefined && targetIdx !== undefined) {
        matrix[sourceIdx][targetIdx] = flow.count;
      }
    });

    // Create chord layout
    const chord = d3.chord().padAngle(0.05).sortSubgroups(d3.descending);

    const chords = chord(matrix);

    // Create ribbon generator
    const ribbon = d3.ribbon().radius(innerRadius);

    // Draw groups
    const group = g.append('g').selectAll('g').data(chords.groups).enter().append('g');

    group
      .append('path')
      .style('fill', (d: any) => data.nodes[d.index].color)
      .style('stroke', '#ffffff')
      .attr('d', d3.arc<any>().innerRadius(innerRadius).outerRadius(outerRadius))
      .on('mouseover', function (event, d: any) {
        d3.select(this).style('opacity', 1);
        showTooltip(event, data.nodes[d.index]);
      })
      .on('mouseout', function () {
        d3.select(this).style('opacity', 0.8);
        hideTooltip();
      });

    // Draw labels
    group
      .append('text')
      .each((d: any) => {
        d.angle = (d.startAngle + d.endAngle) / 2;
      })
      .attr('dy', '.35em')
      .attr(
        'transform',
        (d: any) =>
          `rotate(${(d.angle * 180) / Math.PI - 90})
         translate(${outerRadius + 10})
         ${d.angle > Math.PI ? 'rotate(180)' : ''}`
      )
      .attr('text-anchor', (d: any) => (d.angle > Math.PI ? 'end' : 'start'))
      .text((d: any) => data.nodes[d.index].name)
      .attr('fill', '#ffffff')
      .attr('font-size', '12px');

    // Draw ribbons
    g.append('g')
      .attr('fill-opacity', 0.67)
      .selectAll('path')
      .data(chords)
      .enter()
      .append('path')
      .attr('d', ribbon)
      .style('fill', (d: any) => data.nodes[d.source.index].color)
      .style('stroke', '#ffffff')
      .style('stroke-width', 0.5)
      .on('mouseover', function (event, d: any) {
        d3.select(this).style('fill-opacity', 1);
        const flow = data.flows.find(
          (f) =>
            f.source === data.nodes[d.source.index].id && f.target === data.nodes[d.target.index].id
        );
        if (flow) {
          showFlowTooltip(event, flow);
        }
      })
      .on('mouseout', function () {
        d3.select(this).style('fill-opacity', 0.67);
        hideTooltip();
      });
  };

  // ============================================================================
  // Matrix Heatmap
  // ============================================================================

  const renderMatrixHeatmap = (data: HeatmapData) => {
    const svg = d3.select(svgRef.current);
    const g = svg.append('g').attr('transform', 'translate(150,50)');

    const cellSize = 80;
    const n = data.nodes.length;

    // Create matrix
    const nodeIndexMap = new Map<string, number>();
    data.nodes.forEach((node, i) => nodeIndexMap.set(node.id, i));

    const matrix: number[][] = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));
    data.flows.forEach((flow) => {
      const sourceIdx = nodeIndexMap.get(flow.source);
      const targetIdx = nodeIndexMap.get(flow.target);
      if (sourceIdx !== undefined && targetIdx !== undefined) {
        matrix[sourceIdx][targetIdx] = flow.count;
      }
    });

    // Color scale
    const maxCount = Math.max(...data.flows.map((f) => f.count));
    const colorScale = d3.scaleSequential(d3.interpolateOranges).domain([0, maxCount]);

    // Draw cells
    const row = g
      .selectAll('.row')
      .data(matrix)
      .enter()
      .append('g')
      .attr('class', 'row')
      .attr('transform', (d, i) => `translate(0,${i * cellSize})`);

    const cell = row
      .selectAll('.cell')
      .data((d, i) => d.map((value, j) => ({ value, i, j })))
      .enter()
      .append('g')
      .attr('class', 'cell')
      .attr('transform', (d) => `translate(${d.j * cellSize},0)`);

    cell
      .append('rect')
      .attr('width', cellSize - 2)
      .attr('height', cellSize - 2)
      .attr('fill', (d) => (d.value > 0 ? colorScale(d.value) : '#1a1a1a'))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1)
      .on('mouseover', function (event, d) {
        d3.select(this).attr('stroke-width', 2);
        if (d.value > 0) {
          const from = data.nodes[d.i].name;
          const to = data.nodes[d.j].name;
          showMatrixTooltip(event, from, to, d.value);
        }
      })
      .on('mouseout', function () {
        d3.select(this).attr('stroke-width', 1);
        hideTooltip();
      });

    cell
      .append('text')
      .attr('x', cellSize / 2)
      .attr('y', cellSize / 2)
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => (d.value > maxCount / 2 ? '#000000' : '#ffffff'))
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .text((d) => (d.value > 0 ? d.value : ''));

    // Row labels
    g.selectAll('.row-label')
      .data(data.nodes)
      .enter()
      .append('text')
      .attr('class', 'row-label')
      .attr('x', -10)
      .attr('y', (d, i) => i * cellSize + cellSize / 2)
      .attr('dy', '.35em')
      .attr('text-anchor', 'end')
      .attr('fill', '#ffffff')
      .attr('font-size', '12px')
      .text((d) => d.name);

    // Column labels
    g.selectAll('.col-label')
      .data(data.nodes)
      .enter()
      .append('text')
      .attr('class', 'col-label')
      .attr('x', (d, i) => i * cellSize + cellSize / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', '12px')
      .text((d) => d.name);

    // Legend
    const legendWidth = 300;
    const legendHeight = 20;
    const legend = svg
      .append('g')
      .attr('transform', `translate(${width - legendWidth - 50},${height - 50})`);

    const legendScale = d3.scaleLinear().domain([0, maxCount]).range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale).ticks(5).tickFormat(d3.format('d'));

    legend
      .selectAll('rect')
      .data(d3.range(0, maxCount, maxCount / 100))
      .enter()
      .append('rect')
      .attr('x', (d) => legendScale(d))
      .attr('width', legendWidth / 100)
      .attr('height', legendHeight)
      .attr('fill', (d) => colorScale(d));

    legend
      .append('g')
      .attr('transform', `translate(0,${legendHeight})`)
      .call(legendAxis)
      .selectAll('text')
      .attr('fill', '#ffffff');

    legend
      .append('text')
      .attr('x', legendWidth / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', '12px')
      .text('Transfer Count');
  };

  // ============================================================================
  // Tooltip Functions
  // ============================================================================

  const showTooltip = (event: any, node: ConferenceNode) => {
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'portal-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.9)')
      .style('color', '#ffffff')
      .style('padding', '12px')
      .style('border-radius', '8px')
      .style('border', '1px solid rgba(255, 107, 0, 0.3)')
      .style('font-family', 'system-ui')
      .style('font-size', '14px')
      .style('pointer-events', 'none')
      .style('z-index', '1000').html(`
        <strong>${node.name}</strong><br/>
        Entries: ${node.totalEntries}<br/>
        Commitments: ${node.totalCommitments}<br/>
        Avg NIL: $${(node.avgNILValue / 1000).toFixed(0)}K<br/>
        Strength: ${node.strength}/10
      `);

    tooltip.style('left', `${event.pageX + 10}px`).style('top', `${event.pageY - 10}px`);
  };

  const showFlowTooltip = (event: any, flow: TransferFlow) => {
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'portal-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.9)')
      .style('color', '#ffffff')
      .style('padding', '12px')
      .style('border-radius', '8px')
      .style('border', '1px solid rgba(255, 107, 0, 0.3)')
      .style('font-family', 'system-ui')
      .style('font-size', '14px')
      .style('pointer-events', 'none')
      .style('z-index', '1000').html(`
        <strong>${flow.source} → ${flow.target}</strong><br/>
        Transfers: ${flow.count}<br/>
        Avg NIL Change: ${flow.avgNILDelta >= 0 ? '+' : ''}$${(flow.avgNILDelta / 1000).toFixed(0)}K
      `);

    tooltip.style('left', `${event.pageX + 10}px`).style('top', `${event.pageY - 10}px`);
  };

  const showMatrixTooltip = (event: any, from: string, to: string, count: number) => {
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'portal-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.9)')
      .style('color', '#ffffff')
      .style('padding', '12px')
      .style('border-radius', '8px')
      .style('border', '1px solid rgba(255, 107, 0, 0.3)')
      .style('font-family', 'system-ui')
      .style('font-size', '14px')
      .style('pointer-events', 'none')
      .style('z-index', '1000').html(`
        <strong>${from} → ${to}</strong><br/>
        Transfers: ${count}
      `);

    tooltip.style('left', `${event.pageX + 10}px`).style('top', `${event.pageY - 10}px`);
  };

  const hideTooltip = () => {
    d3.selectAll('.portal-tooltip').remove();
  };

  // ============================================================================
  // Utility Functions
  // ============================================================================

  const getConferenceStrength = (conference: string): number => {
    const strengths: Record<string, number> = {
      SEC: 10,
      ACC: 9,
      'Big 12': 8,
      'Pac-12': 8,
      'Big Ten': 7,
      American: 6,
      'Mountain West': 5,
      'Conference USA': 4,
      'Sun Belt': 4,
      MAC: 3,
      WAC: 3,
    };
    return strengths[conference] || 5;
  };

  const getConferenceColor = (conference: string): string => {
    const colors: Record<string, string> = {
      SEC: '#ff6b00',
      ACC: '#0066cc',
      'Big 12': '#dc2626',
      'Pac-12': '#7c3aed',
      'Big Ten': '#059669',
      American: '#2563eb',
      'Mountain West': '#0891b2',
      'Conference USA': '#65a30d',
      'Sun Belt': '#f59e0b',
      MAC: '#8b5cf6',
      WAC: '#ec4899',
    };
    return colors[conference] || '#6b7280';
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (isLoading) {
    return (
      <div className="w-full p-4 md:p-6 font-sans">
        <div className="flex flex-col items-center justify-center p-16 min-h-[400px]">
          <div className="w-12 h-12 border-4 border-burnt-orange/10 border-t-burnt-orange rounded-full animate-spin" />
          <p className="mt-4 text-gray-400 text-sm">Loading portal heatmap...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 md:p-6 font-sans">
        <div className="flex flex-col items-center justify-center p-16 min-h-[400px]">
          <h3 className="text-xl font-bold text-red-500 mb-2">Failed to Load Heatmap</h3>
          <p className="text-gray-400 text-sm mb-6 text-center">{error}</p>
          <button
            onClick={fetchHeatmapData}
            className="px-6 py-3 bg-gradient-to-br from-burnt-orange to-ember border-none rounded-lg text-white text-sm font-bold cursor-pointer transition-transform duration-200 hover:scale-105 touch-target"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6 font-sans">
      {/* Header - stacks on mobile */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6 pb-4 border-b-2 border-burnt-orange/20">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white m-0 mb-2">
            Transfer Portal Heatmap
          </h2>
          <p className="text-sm text-gray-400 m-0">
            Interactive visualization of conference movement patterns
          </p>
        </div>

        {/* Visualization Type Selector - horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 -mx-1 px-1">
          <button
            onClick={() => setVizType('force')}
            className={`
              px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap
              transition-all duration-200 touch-target-sm
              ${
                vizType === 'force'
                  ? 'bg-burnt-orange/20 border border-burnt-orange text-burnt-orange'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
              }
            `}
          >
            Force Graph
          </button>
          <button
            onClick={() => setVizType('chord')}
            className={`
              px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap
              transition-all duration-200 touch-target-sm
              ${
                vizType === 'chord'
                  ? 'bg-burnt-orange/20 border border-burnt-orange text-burnt-orange'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
              }
            `}
          >
            Chord Diagram
          </button>
          <button
            onClick={() => setVizType('matrix')}
            className={`
              px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap
              transition-all duration-200 touch-target-sm
              ${
                vizType === 'matrix'
                  ? 'bg-burnt-orange/20 border border-burnt-orange text-burnt-orange'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
              }
            `}
          >
            Matrix
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div
        ref={containerRef}
        style={styles.svgContainer}
        className={isMobile ? 'overflow-x-auto' : ''}
      >
        <svg
          ref={svgRef}
          width={width}
          height={height}
          style={styles.svg}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
        />
      </div>

      {/* Instructions - collapsible on mobile */}
      <div className="bg-burnt-orange/5 border border-burnt-orange/20 rounded-xl p-4 md:p-6">
        <h3 className="text-base md:text-lg font-bold text-burnt-orange m-0 mb-4">How to Use</h3>
        <ul className="m-0 pl-6 text-gray-400 text-sm leading-relaxed space-y-1">
          {vizType === 'force' && (
            <>
              <li>{isMobile ? 'Tap and drag' : 'Drag'} nodes to rearrange the layout</li>
              <li>{isMobile ? 'Tap' : 'Hover over'} nodes to see conference statistics</li>
              <li>Arrow thickness indicates transfer volume</li>
              <li>Node size reflects total portal entries</li>
              {!isMobile && <li>Use mouse wheel to zoom in/out</li>}
              {isMobile && <li>Pinch to zoom in/out</li>}
            </>
          )}
          {vizType === 'chord' && (
            <>
              <li>{isMobile ? 'Tap' : 'Hover over'} segments to see conference details</li>
              <li>Ribbons show transfer flows between conferences</li>
              <li>Ribbon thickness indicates transfer volume</li>
              <li>Colors match source conference</li>
            </>
          )}
          {vizType === 'matrix' && (
            <>
              <li>Rows represent source conferences</li>
              <li>Columns represent destination conferences</li>
              <li>Cell color intensity shows transfer volume</li>
              <li>{isMobile ? 'Tap' : 'Hover over'} cells to see exact counts</li>
              {isMobile && <li>Scroll horizontally to see all conferences</li>}
            </>
          )}
        </ul>
      </div>
    </div>
  );
}

// ============================================================================
// Styles (minimal - most styling moved to Tailwind classes)
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  // SVG Container - keeping as inline for dynamic sizing
  svgContainer: {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01))',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '24px',
  },
  svg: {
    display: 'block',
    margin: '0 auto',
    background: 'transparent',
    maxWidth: '100%',
    height: 'auto',
  },
};
