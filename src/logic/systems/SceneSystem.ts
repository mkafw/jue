import * as d3 from 'd3';

type SVGSelection = d3.Selection<SVGGElement, unknown, null, undefined>;
type DefsSelection = d3.Selection<SVGDefsElement, unknown, null, undefined>;

export interface SceneLayers {
  defs: DefsSelection;
  backStrands: SVGSelection;
  intervals: SVGSelection;
  synapses: SVGSelection;
  nodes: SVGSelection;
  frontStrands: SVGSelection;
  pulseStrands: SVGSelection;
}

export class SceneSystem {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  public layers: SceneLayers;

  constructor(svgElement: SVGSVGElement) {
    this.svg = d3.select(svgElement);
    this.svg.selectAll('*').remove();

    this.svg.append('style').text(`
      @keyframes strandFlow {
        to { stroke-dashoffset: -40; }
      }
      .helix-pulse {
        stroke-dasharray: 8 32;
        animation: strandFlow 2s linear infinite;
      }
    `);

    const defs = this.svg.append('defs');
    const mainGroup = this.svg.append('g').attr('class', 'helix-scene');

    this.layers = {
      defs,
      backStrands: mainGroup.append('g').attr('class', 'layer-back-strands'),
      intervals: mainGroup.append('g').attr('class', 'layer-intervals'),
      synapses: mainGroup.append('g').attr('class', 'layer-synapses'),
      nodes: mainGroup.append('g').attr('class', 'layer-nodes'),
      frontStrands: mainGroup.append('g').attr('class', 'layer-front-strands'),
      pulseStrands: mainGroup.append('g').attr('class', 'layer-pulse-strands'),
    };

    this.initializeGradients(defs);
  }

  private initializeGradients(defs: DefsSelection) {
    const createRadial = (id: string, startColor: string, midColor: string, endColor: string) => {
      const grad = defs
        .append('radialGradient')
        .attr('id', id)
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', '50%');

      grad.append('stop').attr('offset', '0%').attr('stop-color', '#FFFFFF');
      grad.append('stop').attr('offset', '40%').attr('stop-color', startColor);
      grad.append('stop').attr('offset', '70%').attr('stop-color', midColor);
      grad.append('stop').attr('offset', '100%').attr('stop-color', endColor);
    };

    // 暗金光晕（问题/认知链）
    createRadial('orbGradGold', '#A88C52', 'rgba(168, 140, 82, 0.4)', 'rgba(168, 140, 82, 0)');
    // 紫藤光晕（目标/践行链）
    createRadial('orbGradPurple', '#A194AD', 'rgba(161, 148, 173, 0.4)', 'rgba(161, 148, 173, 0)');
    // 普通节点浅灰光晕
    const gradDark = defs
      .append('radialGradient')
      .attr('id', 'orbGradDark')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    gradDark.append('stop').attr('offset', '0%').attr('stop-color', '#C4BDCC');
    gradDark.append('stop').attr('offset', '50%').attr('stop-color', '#D8D2DE');
    gradDark.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(216, 210, 222, 0)');
  }
}
