import React, { useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Line } from '@react-three/drei';
import { Question, Objective, GraphNode } from '../types';
import { ThreeNoteCard } from './ThreeNoteCard';

interface ThreeGraphViewProps {
  questions: Question[];
  objectives: Objective[];
  onNodeAction?: (id: string, type: 'QUESTION' | 'OBJECTIVE', action: 'SELECT' | 'DELETE') => void;
}

export const ThreeGraphView: React.FC<ThreeGraphViewProps> = ({ questions, objectives, onNodeAction }) => {
  const steps = useMemo(() => {
    const sortedQ = [...questions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const sortedO = [...objectives].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const maxSteps = Math.max(sortedQ.length, sortedO.length, 12);
    const nodes: GraphNode[] = [];

    for (let i = 0; i < maxSteps; i++) {
      const q = sortedQ[i];
      const o = sortedO[i];

      if (q) {
        nodes.push({
          ...q,
          label: q.title,
          group: 1,
          val: 1,
          type: 'QUESTION',
          strand: 'A',
          yBase: i * 2,
          index: i,
          rawEntity: q,
        });
      }
      if (o) {
        nodes.push({
          ...o,
          label: o.title,
          group: 2,
          val: 1,
          type: 'OBJECTIVE',
          strand: 'B',
          yBase: i * 2,
          index: i,
          rawEntity: o,
        });
      }
    }
    return nodes;
  }, [questions, objectives]);

  const gravityScores = useMemo(() => {
    const scores: Record<string, number> = {};
    steps.forEach((n) => (scores[n.id] = 1));

    steps.forEach((source) => {
      const targets = [...(source.linkedQuestionIds || []), ...(source.linkedOKRIds || [])];
      targets.forEach((tid) => {
        if (scores[tid] !== undefined) scores[tid] += 1;
      });
    });
    return scores;
  }, [steps]);

  const calculatePosition = (node: GraphNode): [number, number, number] => {
    const level = node.rawEntity && 'level' in node.rawEntity ? node.rawEntity.level : 0;
    const gravity = gravityScores[node.id] || 1;
    const baseRadius = level === 2 ? 2 : level === 1 ? 4 : 6;
    const radius = baseRadius * (1 - Math.min((gravity - 1) * 0.1, 0.4));
    const angle = (node.index || 0) * 0.5 + (node.strand === 'B' ? Math.PI : 0);

    const x = radius * Math.sin(angle);
    const z = radius * Math.cos(angle);
    const y = (node.index || 0) * -1.5 + 5;

    return [x, y, z];
  };

  const deductionLines = useMemo(() => {
    const lines: any[] = [];
    const nodeMap = new Map<string, [number, number, number]>();
    steps.forEach((n) => nodeMap.set(n.id, calculatePosition(n)));

    steps.forEach((source) => {
      const targets = [...(source.linkedQuestionIds || []), ...(source.linkedOKRIds || [])];
      targets.forEach((tid) => {
        if (nodeMap.has(tid)) {
          lines.push({
            start: nodeMap.get(source.id),
            end: nodeMap.get(tid),
            color: source.strand === 'A' ? '#A88C52' : '#A194AD',
          });
        }
      });
    });
    return lines;
  }, [steps, gravityScores]);

  return (
    <div className="w-full h-full bg-paper">
      <Canvas>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={50} />
          <OrbitControls enableDamping dampingFactor={0.05} />
          <ambientLight intensity={0.9} />
          <directionalLight position={[10, 10, 10]} intensity={0.5} color="#F6F3F8" />
          <pointLight position={[-10, -10, -10]} intensity={0.3} color="#A88C52" />

          {/* 中央脊柱 */}
          <mesh position={[0, -5, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 40, 8]} />
            <meshStandardMaterial color="#A88C52" transparent opacity={0.4} roughness={0.8} />
          </mesh>

          {/* 关联连线 */}
          <group>
            {deductionLines.map((line, i) => (
              <Line
                key={`line-${i}`}
                points={[line.start, line.end]}
                color={line.color}
                lineWidth={0.5}
                transparent
                opacity={0.4}
              />
            ))}
          </group>

          <group>
            {steps.map((node) => (
              <ThreeNoteCard
                key={node.id}
                node={node}
                gravity={gravityScores[node.id]}
                position={calculatePosition(node)}
                onClick={(id, type) => onNodeAction?.(id, type, 'SELECT')}
              />
            ))}
          </group>
        </Suspense>
      </Canvas>

      <div className="absolute bottom-4 left-4 text-ink-faint text-[10px] tracking-widest pointer-events-none">
        拖拽旋转 · 引力模拟中
      </div>
    </div>
  );
};
