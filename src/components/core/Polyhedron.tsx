import { useRef, useMemo } from "react";
import { useFrame, extend } from "@react-three/fiber";
import { shaderMaterial, Line } from "@react-three/drei";
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

  // ジオメトリから実際の正二十面体の頂点座標（最もYが高い頂点）を取得
  const profileVertex = useMemo(() => {
    const tempGeo = new THREE.IcosahedronGeometry(1.3, 0);
    const pos = tempGeo.getAttribute("position");
    let maxY = -Infinity;
    let vx = 0, vy = 0, vz = 0;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y > maxY) {
        maxY = y;
        vx = pos.getX(i);
        vy = y;
        vz = pos.getZ(i);
      }
    }
    tempGeo.dispose();
    return new THREE.Vector3(vx, vy, vz);
  }, []);

  // カメラアンカーの位置を頂点方向から幾何学的に計算
  // 頂点の延長線上（距離4.5）に配置し、画面の右上方向にオフセット
  const { cameraAnchorPos, lookAnchorPos } = useMemo(() => {
    // 頂点方向の単位ベクトル
    const dir = profileVertex.clone().normalize();

    // 頂点に対する「右」と「上」方向を算出
    const worldUp = new THREE.Vector3(0, 0, 1);
    let right = new THREE.Vector3().crossVectors(dir, worldUp).normalize();
    if (right.lengthSq() < 0.001) {
      right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(1, 0, 0)).normalize();
    }
    const up = new THREE.Vector3().crossVectors(right, dir).normalize();

    // カメラ位置: 頂点方向に4.5の距離 + 左にオフセット + 上にオフセット
    // → 多面体が画面右下に来る構図
    const camPos = dir.clone().multiplyScalar(4.5)
      .add(right.clone().multiplyScalar(-1.8))
      .add(up.clone().multiplyScalar(1.2));

    // 注視点: 原点（多面体の中心）
    // → 常に多面体の中心を見る。オフセットなしでシンプルに。
    const lookPos = new THREE.Vector3(0, 0, 0);

    return {
      cameraAnchorPos: [camPos.x, camPos.y, camPos.z] as [number, number, number],
      lookAnchorPos: [lookPos.x, lookPos.y, lookPos.z] as [number, number, number],
    };
  }, [profileVertex]);

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

      {/* ── デバッグ: 頂点に赤い球 ── */}
      <mesh position={[profileVertex.x, profileVertex.y, profileVertex.z]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color="red" />
      </mesh>

      {/* ── デバッグ: 中心→頂点を結ぶ線 ── */}
      <Line
        points={[[0, 0, 0], [profileVertex.x, profileVertex.y, profileVertex.z]]}
        color="red"
        lineWidth={1.5}
      />

      {/* ── ロックオン用アンカー（グループの子 → 回転に追従） ── */}
      <object3D name="camera-anchor-profile" position={cameraAnchorPos} />
      <object3D name="look-anchor-profile" position={lookAnchorPos} />
    </group>
  );
}
