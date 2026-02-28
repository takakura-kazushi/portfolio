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

  const { cameraAnchorPos, lookAnchorPos, upAnchorPos } = useMemo(() => {
    const dir = profileVertex.clone().normalize();

    const worldUp = new THREE.Vector3(0, 1, 0);
    let right = new THREE.Vector3().crossVectors(dir, worldUp).normalize();
    if (right.lengthSq() < 0.001) {
      right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(1, 0, 0)).normalize();
    }
    const up = new THREE.Vector3().crossVectors(right, dir).normalize();

    const camPos = dir.clone().multiplyScalar(2.6)
      .add(right.clone().multiplyScalar(0.7))
      .add(up.clone().multiplyScalar(0.5));

    const lookPos = new THREE.Vector3(0, 0, 0);
    const upPos = camPos.clone().add(up);

    return {
      cameraAnchorPos: [camPos.x, camPos.y, camPos.z] as [number, number, number],
      lookAnchorPos: [lookPos.x, lookPos.y, lookPos.z] as [number, number, number],
      upAnchorPos: [upPos.x, upPos.y, upPos.z] as [number, number, number],
    };
  }, [profileVertex]);

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

      {/* ── ロックオン用アンカー（グループの子 → 回転に追従） ── */}
      <object3D name="camera-anchor-profile" position={cameraAnchorPos} />
      <object3D name="look-anchor-profile" position={lookAnchorPos} />
      <object3D name="up-anchor-profile" position={upAnchorPos} />
    </group>
  );
}