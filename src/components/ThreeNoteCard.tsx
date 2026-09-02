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
  gravity?: number;
}

export const ThreeNoteCard: React.FC<ThreeNoteCardProps> = ({
  node,
  position,
  onClick,
  active,
  gravity = 1,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const scale = useMemo(() => Math.min(1 + (gravity - 1) * 0.2, 2.5), [gravity]);

  const { color, opacity } = useMemo(() => {
    if (node.isGhost) return { color: '#D8D2DE', opacity: 0.3 };
    const level = node.rawEntity && 'level' in node.rawEntity ? node.rawEntity.level : 0;

    if (level === 2) return { color: '#A88C52', opacity: 1.0 };
    if (level === 1) return { color: '#A194AD', opacity: 0.85 };
    return { color: '#9B94A3', opacity: 0.7 };
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
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
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
            metalness={0.1}
            roughness={0.8}
            transparent
            opacity={hovered || active ? Math.min(opacity + 0.15, 1) : opacity}
          />
        </RoundedBox>

        <Text
          position={[0, 0, 0.04]}
          fontSize={0.12}
          color="#35303A"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.8}
          textAlign="center"
        >
          {node.label}
        </Text>

        {!node.isGhost && (
          <Text position={[0, -0.45, 0.04]} fontSize={0.07} color={color} anchorX="center">
            {node.type}
          </Text>
        )}
      </Float>
    </group>
  );
};
