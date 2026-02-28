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
  `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uLightDir;
  varying vec3 vColor;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
    vec3 viewDir = normalize(cameraPosition - worldPos.xyz);

    float mixStrength = (position.y + 1.3) / 2.6;
    vec3 baseColor = mix(uColorB, uColorA, clamp(mixStrength, 0.0, 1.0));

    float diffuse = dot(worldNormal, uLightDir) * 0.5 + 0.5;

    float fresnel = 1.0 - abs(dot(viewDir, worldNormal));
    fresnel = fresnel * fresnel * fresnel;

    vec3 halfDir = normalize(uLightDir + viewDir);
    float specular = pow(max(dot(worldNormal, halfDir), 0.0), 64.0);

    vColor = baseColor * (0.65 + 0.35 * diffuse);
    vColor += fresnel * 0.2;
    vColor += specular * 0.15;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
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

  // 1. PROFILE用の頂点（Y座標が最大 = ピンク系の色味が強い部分）
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

  // 2. WORKS用の頂点（Y座標が最小 = 水色系の色味が強い部分）
  const worksVertex = useMemo(() => {
    const tempGeo = new THREE.IcosahedronGeometry(1.3, 0);
    const pos = tempGeo.getAttribute("position");
    let minY = Infinity;
    let vx = 0, vy = 0, vz = 0;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y < minY) {
        minY = y;
        vx = pos.getX(i);
        vy = y;
        vz = pos.getZ(i);
      }
    }
    tempGeo.dispose();
    return new THREE.Vector3(vx, vy, vz);
  }, []);

  // 3. SKILLS用の頂点（X座標が最大 = 右側の頂点）
  const skillsVertex = useMemo(() => {
    const tempGeo = new THREE.IcosahedronGeometry(1.3, 0);
    const pos = tempGeo.getAttribute("position");
    let maxX = -Infinity;
    let vx = 0, vy = 0, vz = 0;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      if (x > maxX) {
        maxX = x;
        vx = x;
        vy = pos.getY(i);
        vz = pos.getZ(i);
      }
    }
    tempGeo.dispose();
    return new THREE.Vector3(vx, vy, vz);
  }, []);

  // 4. CONTACT用の頂点（Z座標が最大 = 一番手前の頂点）
  const contactVertex = useMemo(() => {
    const tempGeo = new THREE.IcosahedronGeometry(1.3, 0);
    const pos = tempGeo.getAttribute("position");
    let maxZ = -Infinity;
    let vx = 0, vy = 0, vz = 0;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      if (z > maxZ) {
        maxZ = z;
        vx = pos.getX(i);
        vy = pos.getY(i);
        vz = z;
      }
    }
    tempGeo.dispose();
    return new THREE.Vector3(vx, vy, vz);
  }, []);

  // --- 構図A: PROFILE（左下から見上げる、先端が強調されるアングル） ---
  const { profileCameraAnchorPos, profileLookAnchorPos, profileUpAnchorPos } = useMemo(() => {
    const V = profileVertex.clone();
    const baseCamDir = V.clone().normalize();

    let worldUp = new THREE.Vector3(0, 1, 0);
    if (Math.abs(baseCamDir.dot(worldUp)) > 0.99) {
      worldUp.set(0, 0, 1);
    }

    const baseRight = new THREE.Vector3().crossVectors(worldUp, baseCamDir).normalize();
    const baseUp = new THREE.Vector3().crossVectors(baseCamDir, baseRight).normalize();

    const approachDir = baseCamDir.clone()
      .sub(baseRight.clone().multiplyScalar(0.5))
      .sub(baseUp.clone().multiplyScalar(0.4))
      .normalize();

    const camRight = new THREE.Vector3().crossVectors(worldUp, approachDir).normalize();
    const camUp = new THREE.Vector3().crossVectors(approachDir, camRight).normalize();

    const ZOOM_DISTANCE = 1.6;
    const PAN_RIGHT = 0.7;
    const PAN_UP = 0.4;

    const screenCenter = V.clone()
      .add(camRight.clone().multiplyScalar(PAN_RIGHT))
      .add(camUp.clone().multiplyScalar(PAN_UP));

    const camPos = screenCenter.clone().add(approachDir.clone().multiplyScalar(ZOOM_DISTANCE));
    const lookPos = screenCenter.clone();
    const upPos = camPos.clone().add(camUp);

    return {
      profileCameraAnchorPos: [camPos.x, camPos.y, camPos.z] as [number, number, number],
      profileLookAnchorPos: [lookPos.x, lookPos.y, lookPos.z] as [number, number, number],
      profileUpAnchorPos: [upPos.x, upPos.y, upPos.z] as [number, number, number],
    };
  }, [profileVertex]);


  // --- 構図B: WORKS（宇宙空間が強調される人工衛星アングル、多面体は左下） ---
  const { worksCameraAnchorPos, worksLookAnchorPos, worksUpAnchorPos } = useMemo(() => {
    const dir = worksVertex.clone().normalize();

    const worldUp = new THREE.Vector3(0, 1, 0);
    let right = new THREE.Vector3().crossVectors(dir, worldUp).normalize();
    if (right.lengthSq() < 0.001) {
      right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(1, 0, 0)).normalize();
    }
    const up = new THREE.Vector3().crossVectors(right, dir).normalize();

    const V = worksVertex.clone();

    const lookPos = V.clone()
      .add(right.clone().multiplyScalar(1.8))
      .add(up.clone().multiplyScalar(1.2))
      .sub(dir.clone().multiplyScalar(0.4));

    const camPos = V.clone()
      .add(dir.clone().multiplyScalar(1.3))
      .sub(right.clone().multiplyScalar(0.7))
      .sub(up.clone().multiplyScalar(0.4));

    const upPos = camPos.clone().add(up);

    return {
      worksCameraAnchorPos: [camPos.x, camPos.y, camPos.z] as [number, number, number],
      worksLookAnchorPos: [lookPos.x, lookPos.y, lookPos.z] as [number, number, number],
      worksUpAnchorPos: [upPos.x, upPos.y, upPos.z] as [number, number, number],
    };
  }, [worksVertex]);

  // --- 構図C: SKILLS（多面体を右下に配置、左上に余白を作るアングル） ---
  const { skillsCameraAnchorPos, skillsLookAnchorPos, skillsUpAnchorPos } = useMemo(() => {
    const dir = skillsVertex.clone().normalize();

    const worldUp = new THREE.Vector3(0, 1, 0);
    let right = new THREE.Vector3().crossVectors(dir, worldUp).normalize();
    if (right.lengthSq() < 0.001) {
      right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(1, 0, 0)).normalize();
    }
    const up = new THREE.Vector3().crossVectors(right, dir).normalize();

    const V = skillsVertex.clone();

    // 注視点を左上にずらす（被写体は右下に移動する）
    const lookPos = V.clone()
      .sub(right.clone().multiplyScalar(1.5))
      .add(up.clone().multiplyScalar(1.0))
      .sub(dir.clone().multiplyScalar(0.4));

    const camPos = V.clone()
      .add(dir.clone().multiplyScalar(1.5))
      .add(right.clone().multiplyScalar(0.5))
      .sub(up.clone().multiplyScalar(0.2));

    const upPos = camPos.clone().add(up);

    return {
      skillsCameraAnchorPos: [camPos.x, camPos.y, camPos.z] as [number, number, number],
      skillsLookAnchorPos: [lookPos.x, lookPos.y, lookPos.z] as [number, number, number],
      skillsUpAnchorPos: [upPos.x, upPos.y, upPos.z] as [number, number, number],
    };
  }, [skillsVertex]);

  // --- 構図D: CONTACT（中央で超ドアップになる迫力アングル） ---
  const { contactCameraAnchorPos, contactLookAnchorPos, contactUpAnchorPos } = useMemo(() => {
    const dir = contactVertex.clone().normalize();

    const worldUp = new THREE.Vector3(0, 1, 0);
    let right = new THREE.Vector3().crossVectors(dir, worldUp).normalize();
    if (right.lengthSq() < 0.001) {
      right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(1, 0, 0)).normalize();
    }
    const up = new THREE.Vector3().crossVectors(right, dir).normalize();

    const V = contactVertex.clone();

    // 注視点はほぼ頂点そのもの
    const lookPos = V.clone();

    // カメラを頂点のすぐ手前に配置してドアップに
    const camPos = V.clone()
      .add(dir.clone().multiplyScalar(1.1));

    const upPos = camPos.clone().add(up);

    return {
      contactCameraAnchorPos: [camPos.x, camPos.y, camPos.z] as [number, number, number],
      contactLookAnchorPos: [lookPos.x, lookPos.y, lookPos.z] as [number, number, number],
      contactUpAnchorPos: [upPos.x, upPos.y, upPos.z] as [number, number, number],
    };
  }, [contactVertex]);

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

      {/* ── ターゲットの可視化（確認用） ── */}
      <mesh name="target-profile" position={[profileVertex.x, profileVertex.y, profileVertex.z]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color="red" />
      </mesh>
      <mesh name="target-works" position={[worksVertex.x, worksVertex.y, worksVertex.z]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color="blue" />
      </mesh>
      <mesh name="target-skills" position={[skillsVertex.x, skillsVertex.y, skillsVertex.z]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color="green" />
      </mesh>
      <mesh name="target-contact" position={[contactVertex.x, contactVertex.y, contactVertex.z]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color="orange" />
      </mesh>

      {/* ── PROFILE ロックオン用アンカー ── */}
      <object3D name="camera-anchor-profile" position={profileCameraAnchorPos} />
      <object3D name="look-anchor-profile" position={profileLookAnchorPos} />
      <object3D name="up-anchor-profile" position={profileUpAnchorPos} />

      {/* ── WORKS ロックオン用アンカー ── */}
      <object3D name="camera-anchor-works" position={worksCameraAnchorPos} />
      <object3D name="look-anchor-works" position={worksLookAnchorPos} />
      <object3D name="up-anchor-works" position={worksUpAnchorPos} />

      {/* ── SKILLS ロックオン用アンカー ── */}
      <object3D name="camera-anchor-skills" position={skillsCameraAnchorPos} />
      <object3D name="look-anchor-skills" position={skillsLookAnchorPos} />
      <object3D name="up-anchor-skills" position={skillsUpAnchorPos} />

      {/* ── CONTACT ロックオン用アンカー ── */}
      <object3D name="camera-anchor-contact" position={contactCameraAnchorPos} />
      <object3D name="look-anchor-contact" position={contactLookAnchorPos} />
      <object3D name="up-anchor-contact" position={contactUpAnchorPos} />
    </group>
  );
}