import * as d3 from 'd3';
import { GraphNode, HelixStep } from '../types';
import { calculateHelixPoint, calculateHelixDimensions } from '../utils/helixMath';
import { SceneSystem } from './systems/SceneSystem';
import { NodeSystem } from './systems/NodeSystem';
import { StructureSystem } from './systems/StructureSystem';

interface RendererOptions {
  container: HTMLDivElement;
  svgElement: SVGSVGElement;
  onNodeHover: (node: GraphNode | null, x: number, y: number) => void;
  onNodeClick: (node: GraphNode, isShiftKey: boolean) => void;
  onBackgroundClick: () => void;
}

export class GraphRenderer {
  private scene: SceneSystem;
  private nodeSystem: NodeSystem;
  private structureSystem: StructureSystem;

  private width: number = 800;
  private height: number = 600;
  private rotation: number = 0;

  private baseVelocity: number = 0.0015;
  private momentum: number = 0;
  private friction: number = 0.94;

  private isDragging: boolean = false;
  private isPaused: boolean = false;
  private timer: d3.Timer | null = null;
  private time: number = 0;

  private steps: HelixStep[] = [];
  private allNodes: GraphNode[] = [];
  private links: any[] = [];
  private recentNodeIds: Set<string> = new Set();
  private activeNodeId: string | null = null;
  private selectedNodeId: string | null = null;

  private callbacks: RendererOptions;

  constructor(options: RendererOptions) {
    this.callbacks = options;

    this.scene = new SceneSystem(options.svgElement);
    this.nodeSystem = new NodeSystem(this.scene.layers, {
      onHover: (e, d) => this.handleNodeHover(e, d),
      onLeave: () => this.handleNodeLeave(),
      onClick: (e, d) => this.handleNodeClick(e, d),
    });
    this.structureSystem = new StructureSystem(this.scene.layers);

    this.initializeGlobalInteraction(options.container);
  }

  private initializeGlobalInteraction(container: HTMLDivElement) {
    let lastX = 0;
    let lastTime = 0;

    d3.select(container)
      .on('mousedown', (e) => {
        this.isDragging = true;
        lastX = e.clientX;
        lastTime = Date.now();
        this.momentum = 0;
        container.style.cursor = 'grabbing';
      })
      .on('mousemove', (e) => {
        if (!this.isDragging) return;
        const now = Date.now();
        const deltaX = e.clientX - lastX;
        const deltaTime = now - lastTime;

        this.rotation += deltaX * 0.005;

        if (deltaTime > 0) {
          const instantVelocity = (deltaX / deltaTime) * 0.5;
          this.momentum = this.momentum * 0.5 + instantVelocity * 0.5;
        }

        lastX = e.clientX;
        lastTime = now;
      })
      .on('mouseup', () => {
        this.isDragging = false;
        container.style.cursor = 'grab';
      })
      .on('mouseleave', () => {
        this.isDragging = false;
      })
      .on('wheel', (e) => {
        e.preventDefault();
        const scrollStrength = e.deltaY;
        this.momentum += scrollStrength * 0.0003;
        const maxSpeed = 0.08;
        if (this.momentum > maxSpeed) this.momentum = maxSpeed;
        if (this.momentum < -maxSpeed) this.momentum = -maxSpeed;
      })
      .on('click', (e) => {
        if (e.target === container) {
          this.selectedNodeId = null;
          this.callbacks.onBackgroundClick();
        }
      });
  }

  private handleNodeHover(event: any, node: GraphNode) {
    if (this.isDragging) return;
    this.isPaused = true;
    this.activeNodeId = node.id;
    this.callbacks.onNodeHover(node, event.clientX, event.clientY);
  }

  private handleNodeLeave() {
    this.isPaused = false;
    this.activeNodeId = null;
    this.callbacks.onNodeHover(null, 0, 0);
  }

  private handleNodeClick(event: any, node: GraphNode) {
    event.stopPropagation();
    this.selectedNodeId = this.selectedNodeId === node.id ? null : node.id;
    this.callbacks.onNodeClick(node, event.shiftKey);
  }

  public updateDimensions(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public updateData(steps: HelixStep[], allNodes: GraphNode[], links: any[], recentIds: Set<string>) {
    this.steps = steps;
    this.allNodes = allNodes;
    this.links = links;
    this.recentNodeIds = recentIds;
    this.tick();
  }

  public setSelected(nodeId: string | null) {
    this.selectedNodeId = nodeId;
  }

  public start() {
    if (this.timer) this.timer.stop();
    this.timer = d3.timer(this.tick.bind(this));
  }

  public stop() {
    if (this.timer) this.timer.stop();
  }

  private tick() {
    this.time += 0.01;

    if (!this.isDragging && !this.isPaused) {
      this.rotation += this.momentum;
      this.momentum *= this.friction;

      const flowDir = this.momentum !== 0 ? Math.sign(this.momentum) : 1;
      if (Math.abs(this.momentum) < 0.0001) {
        this.rotation += this.baseVelocity;
      }
    }

    const { height: helixHeight, startY: baseXY } = calculateHelixDimensions(
      this.height,
      this.steps.length
    );
    const stepSpacing = helixHeight / (this.steps.length || 1);
    const floatingY = baseXY + Math.sin(this.time * 0.5) * 12;

    const getPoint = (idx: number, strand: 'A' | 'B') => {
      const y = floatingY + idx * stepSpacing;
      return calculateHelixPoint(y, strand, this.rotation, this.width, floatingY, helixHeight);
    };

    this.structureSystem.render(
      this.steps,
      this.links,
      this.allNodes,
      this.recentNodeIds,
      this.activeNodeId,
      this.selectedNodeId,
      getPoint,
      { startY: floatingY, stepSpacing, width: this.width, height: helixHeight, rotation: this.rotation }
    );

    this.nodeSystem.render(
      this.allNodes,
      this.recentNodeIds,
      this.activeNodeId,
      this.selectedNodeId,
      getPoint
    );
  }
}
