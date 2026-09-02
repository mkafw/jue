import * as d3 from 'd3';
import { SceneLayers } from './SceneSystem';
import { GraphNode } from '../../types';
import { HelixPoint } from '../../utils/helixMath';

interface NodeInteractions {
  onHover: (e: MouseEvent, d: GraphNode) => void;
  onLeave: (e: MouseEvent, d: GraphNode) => void;
  onClick: (e: MouseEvent, d: GraphNode) => void;
}

export class NodeSystem {
  private layers: SceneLayers;
  private callbacks: NodeInteractions;

  constructor(layers: SceneLayers, callbacks: NodeInteractions) {
    this.layers = layers;
    this.callbacks = callbacks;
  }

  public render(
    nodesData: GraphNode[],
    recentNodeIds: Set<string>,
    activeNodeId: string | null,
    selectedNodeId: string | null,
    projectionFn: (idx: number, strand: 'A' | 'B') => HelixPoint
  ) {
    const nodes = this.layers.nodes
      .selectAll<SVGGElement, GraphNode>('g')
      .data(nodesData, (d) => d.id);

    nodes.exit().remove();

    const nodesEnter = nodes
      .enter()
      .append('g')
      .attr('class', 'node-group')
      .style('cursor', (d) => (d.isGhost ? 'default' : 'pointer'))
      .style('pointer-events', 'all')
      .on('mouseenter', (e, d) => this.callbacks.onHover(e, d))
      .on('mouseleave', (e, d) => this.callbacks.onLeave(e, d))
      .on('click', (e, d) => this.callbacks.onClick(e, d));

    this.appendNodeVisuals(nodesEnter);

    const nodesUpdate = nodesEnter.merge(nodes);

    nodesUpdate.each(function (d) {
      const p = projectionFn(d.index!, d.strand);
      Object.assign(d, { _pos: p });
      d3.select(this).attr('transform', `translate(${p.x},${p.y})`);
    });

    this.updateStyles(nodesUpdate, recentNodeIds, activeNodeId, selectedNodeId);

    nodesUpdate.sort((a: any, b: any) => a._pos.z - b._pos.z);
  }

  private appendNodeVisuals(enterSelection: d3.Selection<SVGGElement, GraphNode, any, any>) {
    enterSelection
      .append('circle')
      .attr('class', 'hit-area')
      .attr('r', 20)
      .attr('fill', 'transparent');

    enterSelection.append('circle').attr('class', 'halo');
    enterSelection.append('circle').attr('class', 'core');
    enterSelection
      .append('text')
      .attr('class', 'label')
      .attr('dy', -15)
      .attr('text-anchor', 'middle')
      .style('fill', '#35303A')
      .style('font-size', '10px')
      .style('font-family', 'Inter, sans-serif')
      .style('font-weight', '300')
      .style('pointer-events', 'none');
  }

  private updateStyles(
    selection: d3.Selection<SVGGElement, GraphNode, any, any>,
    recentIds: Set<string>,
    activeId: string | null,
    selectedId: string | null
  ) {
    const now = new Date().getTime();

    selection
      .select('.halo')
      .attr('r', (d) => {
        if (d.isGhost) return 3;
        if (d.id === activeId) return 14;
        return 8;
      })
      .attr('fill', (d) => {
        if (d.isGhost) return 'none';
        if (d.isCrystallized) return 'url(#orbGradGold)';
        if (d.id === activeId || recentIds.has(d.id)) {
          return d.strand === 'A' ? 'url(#orbGradGold)' : 'url(#orbGradPurple)';
        }
        return 'url(#orbGradDark)';
      })
      .attr('stroke', (d) => {
        if (d.isGhost) return '#D8D2DE';
        if (d.isCrystallized) return '#A88C52';
        return recentIds.has(d.id) || activeId === d.id ? '#6B6473' : '#D8D2DE';
      })
      .attr('stroke-width', (d) => {
        if (d.isGhost) return 1;
        return d.isCrystallized || recentIds.has(d.id) || activeId === d.id ? 1.5 : 0.5;
      })
      .attr('opacity', (d) => {
        if (d.isGhost) return 0.2;
        if (d.isCrystallized || activeId === d.id) return 1;
        return recentIds.has(d.id) ? 0.9 : 0.5;
      });

    selection
      .select('.core')
      .attr('r', (d) => (d.isGhost ? 0 : activeId === d.id ? 4 : 2.5))
      .attr('fill', (d) => {
        if (d.isCrystallized) return '#A88C52';
        if (d.strand === 'A') return '#6B6473';
        return '#A194AD';
      });

    selection
      .select('.label')
      .text((d) => (d.isGhost ? '' : d.label.length > 15 ? d.label.substring(0, 12) + '…' : d.label))
      .attr('opacity', (d) => {
        const isSelected = selectedId === d.id;
        const isActive = activeId === d.id;

        if (isActive || isSelected) return 1;
        if (d.isCrystallized && d._pos.z > -0.2) return 0.9;
        if (recentIds.has(d.id) && d._pos.z > -0.5) return 0.8;
        return 0;
      })
      .style('font-weight', (d) => (activeId === d.id ? '500' : '300'));

    selection
      .attr('transform', function (d: any) {
        const p = d._pos;
        const scale = 0.4 + ((p.z + 1) / 2) * 0.8;
        return `translate(${p.x},${p.y}) scale(${scale})`;
      })
      .attr('opacity', (d: any) => {
        const isSelected = selectedId === d.id;
        const isActive = activeId === d.id;

        let entropyFactor = 1;
        if (d.rawEntity?.updatedAt) {
          const daysOld = (now - new Date(d.rawEntity.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
          if (daysOld > 14) entropyFactor = Math.max(0.3, 1 - (daysOld - 14) / 60);
        }

        if (d.isGhost) return 0.1;
        if (isActive || isSelected) return 1.0;
        if (d.isCrystallized) return 1.0;

        const zNorm = (d._pos.z + 1) / 2;
        return (0.2 + 0.8 * zNorm) * entropyFactor;
      });
  }
}
