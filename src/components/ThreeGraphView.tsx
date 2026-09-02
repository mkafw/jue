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

// 螺旋参数
const HELIX_TURNS = 2.5;       // 螺旋圈数
const HELIX_RADIUS = 4;        // 螺旋半径
const HELIX_HEIGHT = 14;       // 螺旋总高度（Y 轴）
const HELIX_Y_OFFSET = 0;      // Y 轴中心偏移

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

  /**
   * 纯正双螺旋布局
   * 问题链（A）与目标链（B）相位差 π，绕中心轴转 HELIX_TURNS 圈
   * 角度随 index 均匀分布，Y 轴线性下降 → 标准 DNA 双螺旋
   */
  const calculatePosition = (node: GraphNode): [number, number, number] => {
    const idx = node.index || 0;
    const total = Math.max(steps.length, 1);
    // 角度：从 0 到 turns*2π，B 链偏移 π
    const angle = (idx / total) * HELIX_TURNS * Math.PI * 2 + (node.strand === 'B' ? Math.PI : 0);
    // 半径：引力越大越靠近中心轴（最多收缩 30%）
    const gravity = gravityScores[node.id] || 1;
    const radius = HELIX_RADIUS * (1 - Math.min((gravity - 1) * 0.08, 0.3));
    // Y 轴：从顶部均匀下降到底部
    const y = HELIX_Y_OFFSET + HELIX_HEIGHT / 2 - (idx / total) * HELIX_HEIGHT;

    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);

    return [x, y, z];
  };

  const deductionLines = useMemo(() => {
    const lines: any[] = [];
    const nodeMap = new Map<string, [number, number, number]>();
    steps.forEach((n) => nodeMap.set(n.id, calculatePosition(n)));

    // 同层横档（A 链 ↔ B 链，类似 DNA 碱基对）
    const byIndex = new Map<number, GraphNode[]>();
    steps.forEach((n) => {
      const arr = byIndex.get(n.index || 0) || [];
      arr.push(n);
      byIndex.set(n.index || 0, arr);
    });
    byIndex.forEach((pair) => {
      if (pair.length === 2) {
        lines.push({
          start: nodeMap.get(pair[0].id),
          end: nodeMap.get(pair[1].id),
          color: '#A88C52',
          isRung: true,
        });
      }
    });

    // 知识关联线
    steps.forEach((source) => {
      const targets = [...(source.linkedQuestionIds || []), ...(source.linkedOKRIds || [])];
      targets.forEach((tid) => {
        if (nodeMap.has(tid)) {
          lines.push({
            start: nodeMap.get(source.id),
            end: nodeMap.get(tid),
            color: source.strand === 'A' ? '#A88C52' : '#A194AD',
            isRung: false,
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
          <PerspectiveCamera makeDefault position={[0, 2, 16]} fov={50} />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            target={[0, 0, 0]}
            minDistance={8}
            maxDistance={30}
          />
          <ambientLight intensity={0.9} />
          <directionalLight position={[10, 10, 10]} intensity={0.5} color="#F6F3F8" />
          <pointLight position={[-10, -10, -10]} intensity={0.3} color="#A88C52" />

          {/* 中央脊柱 */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, HELIX_HEIGHT + 2, 8]} />
            <meshStandardMaterial color="#A88C52" transparent opacity={0.35} roughness={0.8} />
          </mesh>

          {/* 关联连线 */}
          <group>
            {deductionLines.map((line, i) => (
              <Line
                key={`line-${i}`}
                points={[line.start, line.end]}
                color={line.color}
                lineWidth={line.isRung ? 1 : 0.5}
                transparent
                opacity={line.isRung ? 0.5 : 0.3}
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
        拖拽旋转 · 双螺旋引力场
      </div>
    </div>
  );
};
