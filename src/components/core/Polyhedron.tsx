import { useRef, useMemo } from "react";
import { useFrame, extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";

const GradientMaterial = shaderMaterial(
  {
    uColorA: new THREE.Color("#f49ba9"),
    uColorB: new THREE.Color("#aae1f4"),
    uLightDir: new THREE.Vector3(0.5, 1.0, 0.8).normalize(),
  },
  // Vertex Shader: ライティング計算をすべて頂点シェーダーで完結させる
  `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uLightDir;
  varying vec3 vColor;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
    vec3 viewDir = normalize(cameraPosition - worldPos.xyz);

    // y座標に基づくグラデーション
    float mixStrength = (position.y + 1.3) / 2.6;
    vec3 baseColor = mix(uColorB, uColorA, clamp(mixStrength, 0.0, 1.0));

    // Half-Lambert ディフューズ
    float diffuse = dot(worldNormal, uLightDir) * 0.5 + 0.5;

    // フレネルリムライト
    float fresnel = 1.0 - abs(dot(viewDir, worldNormal));
    fresnel = fresnel * fresnel * fresnel;

    // Blinn-Phong スペキュラ
    vec3 halfDir = normalize(uLightDir + viewDir);
    float specular = pow(max(dot(worldNormal, halfDir), 0.0), 64.0);

    // 合成
    vColor = baseColor * (0.65 + 0.35 * diffuse);
    vColor += fresnel * 0.2;
    vColor += specular * 0.15;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // Fragment Shader: 頂点カラーをそのまま出力（per-pixel計算なし）
  `
  varying vec3 vColor;

  void main() {
    gl_FragColor = vec4(vColor, 1.0);
  }
  `
);

extend({ GradientMaterial });

export function Polyhedron() {
  const groupRef = useRef<THREE.Group>(null);

  // フラット法線を持つ非インデックスジオメトリを一度だけ生成
  const solidGeo = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1.3, 0).toNonIndexed();
    geo.computeVertexNormals();
    return geo;
  }, []);

  const wireGeo = useMemo(() => {
    return new THREE.IcosahedronGeometry(1.5, 0);
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = state.clock.elapsedTime * 0.1;
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={solidGeo}>
        {/* @ts-ignore */}
        <gradientMaterial />
      </mesh>

      <mesh geometry={wireGeo}>
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
