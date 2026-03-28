
import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox, Float } from '@react-three/drei';
import * as THREE from 'three';
import { GraphNode } from '../types';

interface ThreeNoteCardProps {
  node: GraphNode;
  position: [number, number, number];
  onClick: (id: string, type: 'QUESTION' | 'OBJECTIVE') => void;
  active?: boolean;
  gravity?: number; // 引力值 (引用计数)
}

export const ThreeNoteCard: React.FC<ThreeNoteCardProps> = ({ node, position, onClick, active, gravity = 1 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // 根据引力计算缩放：1.0 为基础，引力越大，卡片越大 (最高 2.5倍)
  const scale = useMemo(() => Math.min(1 + (gravity - 1) * 0.2, 2.5), [gravity]);
  
  // 根据引力计算能量：引力越大，发光强度越高
  const energyIntensity = useMemo(() => Math.min(0.5 + (gravity - 1) * 0.5, 5.0), [gravity]);

  const { color, emissive, opacity } = useMemo(() => {
    if (node.isGhost) return { color: '#333333', emissive: '#000000', opacity: 0.3 };
    const level = node.rawEntity && 'level' in node.rawEntity ? node.rawEntity.level : 0;
    
    if (level === 2) return { color: '#FFE580', emissive: '#FFE580', opacity: 1.0 };
    if (level === 1) return { color: '#7B2EFF', emissive: '#7B2EFF', opacity: 0.8 };
    return { color: '#AAAAAA', emissive: '#444444', opacity: 0.6 };
  }, [node]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        hovered ? 0.2 : 0,
        0.1
      );
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <group position={position} scale={[scale, scale, scale]}>
      <RoundedBox
        ref={meshRef}
        args={[2, 1.2, 0.05]} 
        radius={0.05}
        smoothness={4}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (!node.isGhost) onClick(node.id, node.type as any);
        }}
      >
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={hovered || active ? energyIntensity + 2 : energyIntensity}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={opacity}
        />
      </RoundedBox>

        {/* Text Label */}
        <Text
          position={[0, 0, 0.04]}
          fontSize={0.12}
          color="white"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.8}
          textAlign="center"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff"
        >
          {node.label}
        </Text>

        {/* Type Badge */}
        {!node.isGhost && (
          <Text
            position={[0, -0.45, 0.04]}
            fontSize={0.08}
            color={color}
            anchorX="center"
          >
            {node.type}
          </Text>
        )}
      </group>
    </Float>
  );
};
