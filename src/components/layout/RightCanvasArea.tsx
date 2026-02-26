"use client";

import { Canvas } from "@react-three/fiber";
import { Polyhedron } from "@/components/core/Polyhedron";

export default function RightCanvasArea() {
  return (
    // flex-1 で親のflexコンテナの余った幅をすべて占有します
    <div className="flex-1 relative h-full bg-white">
      
      {/* HUDレイヤー（後でここに線や座標を追加します） */}
      <div className="absolute inset-0 z-10 pointer-events-none p-8">
      </div>

      {/* 3Dキャンバスレイヤー */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <color attach="background" args={["#ffffff"]} />
          {/* 光の計算を行わない軽量なマテリアルを使用しているため、Lightは不要です */}
          <Polyhedron />
        </Canvas>
      </div>

    </div>
  );
}