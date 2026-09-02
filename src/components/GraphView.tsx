import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Question, Objective, GraphNode, HelixStep } from '../types';
import { Zap, Target, X, Trash2, Edit, Ghost, RefreshCw, Hand } from 'lucide-react';
import { GraphRenderer } from '../logic/GraphRenderer';

interface GraphViewProps {
  questions: Question[];
  objectives: Objective[];
  onNodeAction?: (id: string, type: 'QUESTION' | 'OBJECTIVE', action: 'SELECT' | 'DELETE') => void;
}

export const GraphView: React.FC<GraphViewProps> = ({ questions, objectives, onNodeAction }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const rendererRef = useRef<GraphRenderer | null>(null);

  const [activeNode, setActiveNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const { steps, allNodes, links, recentNodeIds } = useMemo(() => {
    const sortedQ = [...questions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const sortedO = [...objectives].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const rawMax = Math.max(sortedQ.length, sortedO.length);
    const maxSteps = Math.max(rawMax, 16);

    const ladderSteps: HelixStep[] = [];
    const flatNodes: GraphNode[] = [];
    const nodeMap = new Map<string, GraphNode>();

    const completedObjectiveIds = new Set(
      objectives.filter((o) => o.keyResults.some((kr) => kr.status === 'Completed')).map((o) => o.id)
    );

    for (let i = 0; i < maxSteps; i++) {
      const q = sortedQ[i];
      const o = sortedO[i];
      const step: HelixStep = { index: i };

      if (q) {
        const isCrystallized = q.linkedOKRIds.some((id) => completedObjectiveIds.has(id));
        const qNode: GraphNode = {
          ...q,
          label: q.title,
          group: 1,
          val: 1,
          type: 'QUESTION',
          strand: 'A',
          yBase: 0,
          index: i,
          isCrystallized,
          rawEntity: q,
        };
        step.question = qNode;
        flatNodes.push(qNode);
        nodeMap.set(q.id, qNode);
      } else if (i > 0 && i < sortedQ.length + 2) {
        const ghostNode: GraphNode = {
          id: `ghost-q-${i}`,
          group: 0,
          label: 'VOID',
          val: 0.5,
          type: 'GHOST',
          strand: 'A',
          yBase: 0,
          index: i,
          isGhost: true,
        };
        step.question = ghostNode;
        flatNodes.push(ghostNode);
      }

      if (o) {
        const isCrystallized = o.keyResults.some((kr) => kr.status === 'Completed');
        const oNode: GraphNode = {
          ...o,
          label: o.title,
          group: 2,
          val: 1,
          type: 'OBJECTIVE',
          strand: 'B',
          yBase: 0,
          index: i,
          isCrystallized,
          rawEntity: o,
        };
        step.objective = oNode;
        flatNodes.push(oNode);
        nodeMap.set(o.id, oNode);
      }
      ladderSteps.push(step);
    }

    const finalLinks: any[] = [];
    flatNodes.forEach((source) => {
      if (source.isGhost) return;
      const targets = [...(source.linkedQuestionIds || []), ...(source.linkedOKRIds || [])];
      targets.forEach((tid) => {
        if (nodeMap.has(tid) && source.id < tid) {
          finalLinks.push({ source, target: nodeMap.get(tid) });
        }
      });
    });

    if (flatNodes.length > 5) {
      for (let m = 0; m < 2; m++) {
        const start = flatNodes[Math.floor((Math.random() * flatNodes.length) / 2)];
        const end =
          flatNodes[
            Math.floor((Math.random() * flatNodes.length) / 2) + Math.floor(flatNodes.length / 2)
          ];
        if (start && end && !start.isGhost && !end.isGhost && start !== end) {
          finalLinks.push({ source: start, target: end, type: 'MUTATION' });
        }
      }
    }

    const sortedAll = [...flatNodes]
      .filter((n) => !n.isGhost)
      .sort(
        (a, b) =>
          new Date(b.rawEntity?.createdAt || 0).getTime() -
          new Date(a.rawEntity?.createdAt || 0).getTime()
      );
    const recentIds = new Set(sortedAll.slice(0, 3).map((n) => n.id));

    return { steps: ladderSteps, allNodes: flatNodes, links: finalLinks, recentNodeIds: recentIds };
  }, [questions, objectives]);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;
    rendererRef.current = new GraphRenderer({
      container: containerRef.current,
      svgElement: svgRef.current,
      onNodeHover: (node, x, y) => {
        setActiveNode(node);
        if (node) setTooltipPos({ x, y });
      },
      onNodeClick: (node, isShiftKey) => {
        if (node.isGhost) return;
        setSelectedNode((prev) => (prev?.id === node.id ? null : node));
        if (onNodeAction) onNodeAction(node.id, node.type as any, isShiftKey ? 'DELETE' : 'SELECT');
      },
      onBackgroundClick: () => {
        setSelectedNode(null);
      },
    });
    rendererRef.current.start();
    return () => {
      rendererRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      const width = containerRef.current?.clientWidth || 800;
      const height = containerRef.current?.clientHeight || 600;
      rendererRef.current.updateDimensions(width, height);
      rendererRef.current.updateData(steps, allNodes, links, recentNodeIds);
    }
  }, [steps, allNodes, links, recentNodeIds]);

  useEffect(() => {
    rendererRef.current?.setSelected(selectedNode?.id || null);
  }, [selectedNode]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-paper cursor-grab active:cursor-grabbing">
      <svg ref={svgRef} className="absolute inset-0 w-full h-full z-10" style={{ overflow: 'visible' }} />

      {!selectedNode && !activeNode && (
        <div className="absolute bottom-6 right-6 text-ink-faint flex items-center space-x-2 pointer-events-none select-none z-20">
          <Hand size={13} strokeWidth={1.5} />
          <span className="text-[10px] tracking-widest">拖拽旋转</span>
        </div>
      )}

      {/* 悬浮提示 */}
      {activeNode && !selectedNode && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltipPos.x + 30, top: tooltipPos.y - 10 }}
        >
          <div className="w-56 bg-paper border border-line rounded-card overflow-hidden shadow-paper">
            <div className={`h-0.5 w-full ${activeNode.isGhost ? 'bg-line' : activeNode.strand === 'A' ? 'bg-gold' : 'bg-wisteria'}`} />
            <div className="p-3">
              {activeNode.isGhost ? (
                <div className="text-ink-faint flex items-center gap-2">
                  <Ghost size={12} /> <span className="text-[10px] tracking-widest">暗物质</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-1.5 mb-1.5">
                    {activeNode.type === 'QUESTION' ? (
                      <Zap size={11} className="text-gold" strokeWidth={1.5} />
                    ) : (
                      <Target size={11} className="text-wisteria" strokeWidth={1.5} />
                    )}
                    <span className="text-[9px] text-ink-faint tracking-wider">
                      坐标 {activeNode.index}
                    </span>
                    {activeNode.isCrystallized && (
                      <RefreshCw size={9} className="text-gold" strokeWidth={1.5} />
                    )}
                  </div>
                  <h3 className="text-xs font-light text-ink leading-snug">{activeNode.label}</h3>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 详情面板 */}
      {selectedNode && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-0 right-0 h-full w-full md:w-96 bg-paper border-l border-line z-50 flex flex-col shadow-paper"
        >
          <div className={`h-0.5 w-full ${selectedNode.strand === 'A' ? 'bg-gold' : 'bg-wisteria'}`} />
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                {selectedNode.type === 'QUESTION' ? (
                  <Zap size={14} className="text-gold" strokeWidth={1.5} />
                ) : (
                  <Target size={14} className="text-wisteria" strokeWidth={1.5} />
                )}
                <span className="text-[10px] text-ink-faint tracking-widest">{selectedNode.type}</span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1.5 hover:bg-paper-deep rounded-ticket text-ink-faint hover:text-ink transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {selectedNode.isCrystallized && (
              <div className="mb-5 inline-flex items-center px-3 py-1 bg-gold/5 border border-gold/20 rounded-ticket text-gold text-[10px] tracking-wider">
                <RefreshCw size={11} className="mr-1.5" strokeWidth={1.5} />
                已结晶为公理
              </div>
            )}

            <h2 className="font-serif font-extralight text-2xl text-ink mb-5 leading-tight tracking-wide">
              {selectedNode.label}
            </h2>

            <div className="text-sm text-ink-soft font-light leading-relaxed">
              {selectedNode.content || <span className="italic text-ink-faint">尚无内容。</span>}
            </div>
          </div>

          <div className="p-4 border-t border-line bg-paper-card/40 flex space-x-3">
            <button className="flex-1 py-2.5 bg-paper-card hover:bg-paper-deep text-ink rounded-card flex items-center justify-center text-[11px] tracking-wider transition-all border border-line">
              <Edit size={13} className="mr-1.5 text-ink-faint" strokeWidth={1.5} />
              编辑
            </button>
            <button
              onClick={() => {
                if (confirm('确认移除此节点？')) {
                  if (onNodeAction) onNodeAction(selectedNode.id, selectedNode.type as any, 'DELETE');
                  setSelectedNode(null);
                }
              }}
              className="flex-1 py-2.5 bg-cinnabar/5 hover:bg-cinnabar/10 text-cinnabar rounded-card flex items-center justify-center text-[11px] tracking-wider transition-all border border-cinnabar/20"
            >
              <Trash2 size={13} className="mr-1.5" strokeWidth={1.5} />
              移除
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
