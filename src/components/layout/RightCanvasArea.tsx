"use client";

import { useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, TrackballControls } from "@react-three/drei";
import { Polyhedron } from "@/components/core/Polyhedron";
import { CameraTracker } from "@/components/core/CameraTracker";
import { HUD } from "@/components/layout/HUD";
import { CameraAnimator } from "@/components/core/CameraAnimator";

export default function RightCanvasArea() {
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0, z: 5 });
  const [cameraRotation, setCameraRotation] = useState(0);

  const controlsRef = useRef<any>(null);

  const handleCameraUpdate = (
    position: { x: number; y: number; z: number },
    rotation: number
  ) => {
    setCameraPosition(position);
    setCameraRotation(rotation);
  };

  return (
    <div className="flex-1 relative h-full bg-white">

      {/* HUDレイヤー */}
      <HUD cameraPosition={cameraPosition} cameraRotation={cameraRotation} />

      {/* 3Dキャンバスレイヤー */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <color attach="background" args={["#ffffff"]} />
          <Polyhedron />
          {/* <OrbitControls enableZoom={true} enablePan={false} /> */}
          <TrackballControls
            ref={controlsRef}
            noPan={true}
            minDistance={3.0}
            maxDistance={10}
            dynamicDampingFactor={0.05}
            rotateSpeed={1.5}
          />
          <CameraAnimator controlsRef={controlsRef} />
          <CameraTracker onUpdate={handleCameraUpdate} />
        </Canvas>
      </div>

    </div>
  );
}