import { useRef } from "react";
import { useFrame, extend } from "@react-three/fiber";
import { Icosahedron, shaderMaterial } from "@react-three/drei";
import * as THREE from "three";

const GradientMaterial = shaderMaterial(
  {
    uColorA: new THREE.Color("#f49ba9"),
    uColorB: new THREE.Color("#aae1f4"),
  },
  // Vertex Shader: 頂点ごとの位置情報をFragment Shaderに渡す
  `
  varying vec3 vPosition;
  void main() {
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // Fragment Shader: 座標(y軸)に基づいて色を線形補間する
  `
  varying vec3 vPosition;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  void main() {
    // y座標（-1.3 〜 1.3）を 0.0 〜 1.0 の範囲に変換
    float mixStrength = (vPosition.y + 1.3) / 2.6;
    vec3 color = mix(uColorB, uColorA, clamp(mixStrength, 0.0, 1.0));
    gl_FragColor = vec4(color, 1.0);
  }
  `
);

extend({ GradientMaterial });

export function Polyhedron() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = state.clock.elapsedTime * 0.1;
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      <Icosahedron args={[1.3, 0]}>
        {/* @ts-ignore */}
        <gradientMaterial />
      </Icosahedron>

      <Icosahedron args={[1.5, 0]}>
        <meshBasicMaterial color="#ffffff" wireframe={true} transparent opacity={0.5} />
      </Icosahedron>
    </group>
  );
}
