"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

interface HUDProps {
  cameraPosition?: { x: number; y: number; z: number };
  cameraRotation?: number; // y-axis rotation in degrees
}

export function HUD({ cameraPosition, cameraRotation }: HUDProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewportHeight, setViewportHeight] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  // --- HUDラインの座標計算 ---
  // 1. 開始位置（上からの余白）
  const startY = 220; // 75px from the top
  // 2. 1回目の直線の終わり
  const bend1Y = Math.max(startY + 60, viewportHeight * 0.25);
  // 3. 45度曲がる距離（X・Yともに25px移動）
  const bendSize = 25;
  // 4. 2回目の直線の終わり
  const bend2Y = Math.max(bend1Y + bendSize + 60, viewportHeight - 120);
  // パスデータを変数化
  const leftPathData = `
    M 0,${startY} 
    L 0,${bend1Y} 
    L ${bendSize},${bend1Y + bendSize} 
    L ${bendSize},${bend2Y} 
    L 0,${bend2Y + bendSize}
  `;

  // --- HUDラインの座標計算（上部） ---
  const topStartX = 70;
  const topStartY = Math.min(80, viewportHeight * 0.1);
  const topBendX = Math.max(topStartX + 50, viewportWidth - 100);
  const topBendSize = Math.min(30, (viewportWidth - topStartX - 20) / 2);
  const topPathData = `
    M ${topStartX},${topStartY}
    L ${topBendX},${topStartY}
    L ${topBendX + topBendSize},${topStartY - topBendSize}
  `;



  const leftLineRef = useRef<SVGPathElement>(null);
  const leftDashRef = useRef<SVGPathElement>(null);
  const topLineRef = useRef<SVGPathElement>(null);
  const timeBlockRef = useRef<HTMLDivElement>(null);
  const timeTextRef = useRef<HTMLDivElement>(null);
  // const bottomRulerRef = useRef<HTMLDivElement>(null);  // 次回以降追加

  useEffect(() => {
    // refがまだない場合（初回レンダリングでviewportHeightが0の時など）はスキップ
    if (!leftLineRef.current || !leftDashRef.current) return;

    // Reactの再レンダリング時にアニメーションが重複・競合するのを防ぐため、
    // gsap.context() で囲み、クリーンアップ可能にします。
    const ctx = gsap.context(() => {
      const leftLineLength = leftLineRef.current!.getTotalLength();

      // HUD起動シークエンス用のタイムラインを作成
      const hudTimeline = gsap.timeline({ delay: 0.2 });

      // --- ベースの線（黒）のセットアップとアニメーション（左） ---
      gsap.set(leftLineRef.current, {
        strokeDasharray: leftLineLength,
        strokeDashoffset: leftLineLength,
      });

      hudTimeline.to(leftLineRef.current, {
        strokeDashoffset: 0,
        duration: 1.2,
        ease: "power2.inOut",
      });



      // --- 〇 ベースの線（黒・上部）の追加 ---
      const topLength = topLineRef.current!.getTotalLength();
      gsap.set(topLineRef.current, {
        strokeDasharray: topLength,
        strokeDashoffset: topLength,
      });
      hudTimeline.addLabel("topLineStart", "-=0.8");

      hudTimeline.to(topLineRef.current, {
        strokeDashoffset: 0,
        duration: 1.2,
        ease: "power2.inOut",
      }, "topLineStart");

      // --- 〇 時刻表示のスキャナーアニメーション ---
      gsap.set(timeBlockRef.current, { left: "0%", right: "100%" });
      gsap.set(timeTextRef.current, { clipPath: "inset(0% 100% 0% 0%)", opacity: 1 });

      // 1. ブロックの「右端」が伸びる（線のスタートから 0.6秒後 に開始）
      hudTimeline.to(timeBlockRef.current, {
        right: "0%",
        duration: 0.4,
        ease: "power2.inOut",
      }, "topLineStart+=0.6");

      // 2. ブロックの「左端」が縮む（線のスタートから 0.8秒後 に開始）
      // ⇒ 0.8秒 + 0.4秒 = 1.2秒（線のアニメーション完了と1ミリ秒のズレもなく同時に完了する）
      hudTimeline.to(timeBlockRef.current, {
        left: "100%",
        duration: 0.4,
        ease: "power2.inOut",
      }, "topLineStart+=0.8");

      // 3. 文字の表示（左端の移動と完全に同期）
      hudTimeline.to(timeTextRef.current, {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 0.4,
        ease: "power2.inOut",
      }, "topLineStart+=0.8");

      // --- 切れ目（白）の無限ループアニメーション(左) ---
      const dashLength = 15;

      // 初期位置：dashLength
      // 切れ目の長さ分だけオフセットをプラスにすることで、パスの始点より「15px手前（画面外）」に切れ目を待機させます。
      gsap.set(leftDashRef.current, {
        strokeDasharray: `${dashLength} ${leftLineLength}`,
        strokeDashoffset: dashLength,
      });

      // 終点位置：-leftLineLength
      // オフセットをマイナス全長分にすることで、パスの終点より「後ろ（画面外）」まで完全に移動し切るようにします。
      gsap.to(leftDashRef.current, {
        strokeDashoffset: -leftLineLength,
        duration: 3.0,
        ease: "none",
        repeat: -1,
        repeatDelay: 2.0,
        delay: 1.7,
      });
    });

    // コンポーネントのアンマウント時、または依存配列が更新された時に、
    // それまで走っていたGSAPアニメーションをすべてリセット（破棄）します
    return () => ctx.revert();
  }, [viewportHeight, startY, bend1Y, bend2Y, leftPathData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10); // Update every 10ms for milliseconds display

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setViewportHeight(containerRef.current.clientHeight);
        setViewportWidth(containerRef.current.clientWidth);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Format time as YYYY.MM.DD.HHmm
  const formatTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}.${month}.${day}.${hours}${minutes}`;
  };

  // Format coordinates
  const formatCoord = (value: number) => {
    return value.toFixed(3);
  };

  const rotation = cameraRotation ? Math.round(cameraRotation) : 0;

  return (
    <div ref={containerRef} className="absolute inset-0 z-10 pointer-events-none font-mono text-[8.5px] text-black">
      {/* Top-Left: Coordinates - Vertical Text */}
      <div
        className="absolute top-8 left-[4px] opacity-40 text-[7px] tracking-widest"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        coordinates
      </div>
      <div
        className="absolute top-8 left-4 opacity-70 tracking-wide text-[8.5px]"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        {cameraPosition
          ? `${formatCoord(cameraPosition.x)} ・ ${formatCoord(cameraPosition.y)} ・ ${formatCoord(cameraPosition.z)}`
          : "0.000 ・ 0.000 ・ 0.000"}
      </div>
      {/* Top Edge: Horizontal Decorative Line */}
      {viewportWidth > 0 && (
        <svg className="absolute top-0 left-0 w-full h-[60px] opacity-65 pointer-events-none overflow-visible">
          <path
            ref={topLineRef}
            d={topPathData}
            fill="none"
            stroke="#1A1B25"
            strokeWidth="0.5"
          />
        </svg>
      )}

      {/* Top-Right: Time */}
      <div
        className="absolute tracking-wide text-[8.5px]"
        style={{
          left: `${topBendX - 10}px`,
          top: `${topStartY - 20}px`,
          transform: 'translateX(-100%)'
        }}
      >
        <div className="relative flex items-center px-1 py-0.5 -mx-1 -my-0.5">

          <div
            ref={timeBlockRef}
            className="absolute inset-0 bg-[#1A1B25] z-10"
          // ※style={{ margin: '-2px -4px' }} は削除しました
          ></div>

          <div
            ref={timeTextRef}
            className="flex items-center gap-1.5 opacity-65"
          >
            <span className="w-[1px] h-[9px] bg-black opacity-50 block"></span>
            <span>{formatTime(currentTime)}</span>
          </div>

        </div>
      </div>

      {/* Left Edge: 4-bend Decorative Line */}
      {viewportHeight > 0 && (
        <svg className="absolute left-4 top-0 w-[60px] h-full opacity-65 overflow-visible pointer-events-none">
          <path
            ref={leftLineRef}
            d={leftPathData}
            fill="none"
            stroke="#1A1B25"
            strokeWidth="0.5"
          />
          {/* 白の切れ目（ベースの線を上書きして削る） */}
          <path
            ref={leftDashRef}
            d={leftPathData}
            fill="none"
            stroke="#ffffff" // 背景色と同じ白
            // ベースの線より少しだけ太くすることで、アンチエイリアスのグレーのフチが残るのを防止
            strokeWidth="1.0"
          />

        </svg>
      )
      }


      {/* Right Edge: Triangle Markers */}
      <div className="absolute right-5 top-[27%] flex flex-col space-y-4 text-[8px] opacity-35">
        <div className="flex items-center justify-end">
          <span className="w-[4.5px] h-[4.5px] border-r border-t border-black transform rotate-45"></span>
        </div>
        <div className="flex items-center justify-end">
          <span className="w-[4.5px] h-[4.5px] border-r border-t border-black transform rotate-45"></span>
        </div>
        <div className="flex items-center justify-end">
          <span className="w-[4.5px] h-[4.5px] bg-black transform rotate-45"></span>
        </div>
        <div className="flex items-center justify-end">
          <span className="w-[4.5px] h-[4.5px] border-r border-t border-black transform rotate-45"></span>
        </div>
      </div>

      {/* Bottom: Angle Measure */}
      <div className="absolute bottom-5 left-[27%] right-5">
        {/* Top line with time marker */}
        <div className="relative mb-0.5">
          <div className="h-[0.5px] bg-black opacity-12"></div>
          <div className="absolute right-0 -top-2.5 text-[7.5px] opacity-30 tracking-wide">
            {formatTime(currentTime)}
          </div>
        </div>

        {/* Angle display */}
        <div className="relative h-4 flex items-center mb-0.5">
          <div className="text-[8.5px] opacity-55 absolute left-0 tracking-wide">
            {rotation}°
          </div>
          <div className="text-[7.5px] opacity-28 absolute tracking-wide" style={{ left: '37%' }}>
            {rotation + 340}°
          </div>
        </div>

        {/* Main measure line with ticks */}
        <div className="relative h-4">
          <div className="absolute bottom-0 left-0 right-0 h-[0.5px] bg-black opacity-18"></div>
          {/* Generate tick marks */}
          {Array.from({ length: 65 }).map((_, i) => {
            const isLong = i % 10 === 0;
            const isMedium = i % 5 === 0;
            let height = '2.5px';
            if (isLong) height = '11px';
            else if (isMedium) height = '6px';

            return (
              <div
                key={i}
                className="absolute bottom-0 w-[0.5px] bg-black opacity-18"
                style={{
                  left: `${(i / 65) * 100}%`,
                  height: height,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
