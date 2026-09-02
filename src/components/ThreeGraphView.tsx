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
const HELIX_RADIUS = 4.5;      // 螺旋半径
const HELIX_HEIGHT = 16;       // 螺旋总高度（Y 轴）
const HELIX_Y_OFFSET = 0;      // Y 轴中心偏移
const HELIX_SEGMENTS = 120;    // 骨架曲线细分段数

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
   */
  const calculatePosition = (node: GraphNode): [number, number, number] => {
    const idx = node.index || 0;
    const total = Math.max(steps.length, 1);
    const angle = (idx / total) * HELIX_TURNS * Math.PI * 2 + (node.strand === 'B' ? Math.PI : 0);
    const gravity = gravityScores[node.id] || 1;
    const radius = HELIX_RADIUS * (1 - Math.min((gravity - 1) * 0.06, 0.25));
    const y = HELIX_Y_OFFSET + HELIX_HEIGHT / 2 - (idx / total) * HELIX_HEIGHT;

    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);

    return [x, y, z];
  };

  /**
   * 生成螺旋骨架曲线上的密集点（用于绘制连续的糖-磷酸骨架）
   */
  const generateHelixCurve = (strand: 'A' | 'B'): [number, number, number][] => {
    const points: [number, number, number][] = [];
    for (let i = 0; i <= HELIX_SEGMENTS; i++) {
      const t = i / HELIX_SEGMENTS;
      const angle = t * HELIX_TURNS * Math.PI * 2 + (strand === 'B' ? Math.PI : 0);
      const x = HELIX_RADIUS * Math.cos(angle);
      const z = HELIX_RADIUS * Math.sin(angle);
      const y = HELIX_Y_OFFSET + HELIX_HEIGHT / 2 - t * HELIX_HEIGHT;
      points.push([x, y, z]);
    }
    return points;
  };

  const strandACurve = useMemo(() => generateHelixCurve('A'), []);
  const strandBCurve = useMemo(() => generateHelixCurve('B'), []);

  /**
   * 同层横档（DNA 碱基对）：连接同一 index 的 A 链和 B 链节点
   */
  const rungLines = useMemo(() => {
    const lines: { start: [number, number, number]; end: [number, number, number] }[] = [];
    const byIndex = new Map<number, GraphNode[]>();
    steps.forEach((n) => {
      const arr = byIndex.get(n.index || 0) || [];
      arr.push(n);
      byIndex.set(n.index || 0, arr);
    });
    const nodeMap = new Map<string, [number, number, number]>();
    steps.forEach((n) => nodeMap.set(n.id, calculatePosition(n)));

    byIndex.forEach((pair) => {
      if (pair.length === 2) {
        lines.push({
          start: nodeMap.get(pair[0].id)!,
          end: nodeMap.get(pair[1].id)!,
        });
      }
    });
    return lines;
  }, [steps, gravityScores]);

  /**
   * 知识关联线（跨层连接）
   */
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
          <PerspectiveCamera makeDefault position={[0, 2, 17]} fov={50} />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            target={[0, 0, 0]}
            minDistance={8}
            maxDistance={35}
          />
          <ambientLight intensity={0.9} />
          <directionalLight position={[10, 10, 10]} intensity={0.5} color="#F6F3F8" />
          <pointLight position={[-10, -10, -10]} intensity={0.3} color="#A88C52" />

          {/* 中央脊柱 */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, HELIX_HEIGHT + 2, 8]} />
            <meshStandardMaterial color="#A88C52" transparent opacity={0.2} roughness={0.8} />
          </mesh>

          {/* DNA 双螺旋骨架 —— 两条连续的糖-磷酸链 */}
          <Line
            points={strandACurve}
            color="#A88C52"
            lineWidth={2}
            transparent
            opacity={0.7}
          />
          <Line
            points={strandBCurve}
            color="#A194AD"
            lineWidth={2}
            transparent
            opacity={0.7}
          />

          {/* 同层横档（碱基对） */}
          <group>
            {rungLines.map((line, i) => (
              <Line
                key={`rung-${i}`}
                points={[line.start, line.end]}
                color="#C4A96E"
                lineWidth={1.5}
                transparent
                opacity={0.5}
              />
            ))}
          </group>

          {/* 知识关联线（跨层） */}
          <group>
            {deductionLines.map((line, i) => (
              <Line
                key={`link-${i}`}
                points={[line.start, line.end]}
                color={line.color}
                lineWidth={0.5}
                transparent
                opacity={0.25}
              />
            ))}
          </group>

          {/* 节点卡片 —— 缩小尺寸，沿螺旋分布 */}
          <group>
            {steps.map((node) => (
              <ThreeNoteCard
                key={node.id}
                node={node}
                gravity={gravityScores[node.id]}
                position={calculatePosition(node)}
                size={0.55}
                onClick={(id, type) => onNodeAction?.(id, type, 'SELECT')}
              />
            ))}
          </group>
        </Suspense>
      </Canvas>

      <div className="absolute bottom-4 left-4 text-ink-faint text-[10px] tracking-widest pointer-events-none">
        拖拽旋转 · DNA 双螺旋知识场
      </div>
    </div>
  );
};
