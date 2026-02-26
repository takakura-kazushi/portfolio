"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Polyhedron } from "@/components/core/Polyhedron";
import { CameraTracker } from "@/components/core/CameraTracker";
import { HUD } from "@/components/layout/HUD";

export default function RightCanvasArea() {
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0, z: 5 });
  const [cameraRotation, setCameraRotation] = useState(0);

  const handleCameraUpdate = (
    position: { x: number; y: number; z: number },
    rotation: number
  ) => {
    setCameraPosition(position);
    setCameraRotation(rotation);
  };

  return (
    // flex-1 で親のflexコンテナの余った幅をすべて占有します
    <div className="flex-1 relative h-full bg-white">
      
      {/* HUDレイヤー */}
      <HUD cameraPosition={cameraPosition} cameraRotation={cameraRotation} />

      {/* 3Dキャンバスレイヤー */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <color attach="background" args={["#ffffff"]} />
          {/* 光の計算を行わない軽量なマテリアルを使用しているため、Lightは不要です */}
          <Polyhedron />
          <OrbitControls enableZoom={true} enablePan={false} />
          <CameraTracker onUpdate={handleCameraUpdate} />
        </Canvas>
      </div>

    </div>
  );
}