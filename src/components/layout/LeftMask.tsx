"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function LeftMask() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const topLineRef = useRef<HTMLDivElement>(null);
  const bottomLineRef = useRef<HTMLDivElement>(null);

  // HUDスキャナー用
  const scanBlockRef = useRef<HTMLDivElement>(null);
  const titleClipRef = useRef<HTMLDivElement>(null);

  // グリッチブロック（小さいノイズ矩形）
  const glitchRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 左端マーカー（縦ライン）
  const markerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.3 });

      // ── 初期状態 ─────────────────────────────────────────────────────
      gsap.set([topLineRef.current, bottomLineRef.current], {
        scaleX: 0,
        transformOrigin: "left",
      });
      gsap.set(scanBlockRef.current, { left: "0%", right: "100%" });
      gsap.set(titleClipRef.current, {
        clipPath: "inset(0% 100% 0% 0%)",
        opacity: 1,
      });
      gsap.set(markerRef.current, { clipPath: "inset(0% 0% 100% 0%)" });
      glitchRefs.current.forEach((el) => {
        if (!el) return;
        gsap.set(el, { opacity: 0, scaleX: 0, transformOrigin: "left" });
      });

      // ── Phase 1（0s〜0.12s）: 左端マーカーが上から伸びる ────────────
      tl.to(markerRef.current, {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 0.12,
        ease: "power2.inOut",
      }, 0)
        // ── Phase 1.5（0.12s〜0.2s）: 左端マーカーが上から下へ消える ──────
        .to(markerRef.current, {
          clipPath: "inset(100% 0% 0% 0%)",
          duration: 0.08,
          ease: "power2.in",
        }, 0.12);

      // ── Phase 2（0.2s〜0.65s）: 上の装飾横線が左から右へ ───────────────
      tl.to(topLineRef.current, {
        scaleX: 1,
        duration: 0.45,
        ease: "power2.inOut",
      }, 0.2);

      // ── Phase 3（0.3s〜）: グリッチブロックがランダム点滅 ───────────────
      glitchRefs.current.forEach((el, i) => {
        if (!el) return;
        const d = 0.3 + i * 0.07;
        tl.to(el, { opacity: 1, scaleX: 1, duration: 0.06, ease: "none" }, d)
          .to(el, { opacity: 0, duration: 0.05, ease: "none" }, d + 0.07)
          .to(el, { opacity: 0.7, scaleX: 0.6, duration: 0.04, ease: "none" }, d + 0.14)
          .to(el, { opacity: 0, duration: 0.04, ease: "none" }, d + 0.20);
      });

      // ── Phase 4（0.55s〜0.93s）: スキャンブロックが右へ走る ─────────────
      tl.to(scanBlockRef.current, {
        right: "0%",
        duration: 0.38,
        ease: "power2.inOut",
      }, 0.55);

      // ── Phase 5（0.75s〜1.13s）: ブロック左端縮小 + テキスト露出 ─────────
      tl.to(scanBlockRef.current, {
        left: "100%",
        duration: 0.38,
        ease: "power2.inOut",
      }, 0.75);

      tl.to(titleClipRef.current, {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 0.38,
        ease: "power2.inOut",
      }, 0.75);

      // ── Phase 6（1.05s〜1.5s）: 下の装飾横線が伸びる ─────────────────────
      tl.to(bottomLineRef.current, {
        scaleX: 1,
        duration: 0.45,
        ease: "power2.inOut",
      }, 1.05);

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="w-[30%] max-w-[400px] min-w-[280px] h-full bg-[#e5e5e5] border-r border-black flex-shrink-0 flex flex-col justify-center px-12 z-20 shadow-[2px_0_10px_rgba(0,0,0,0.05)]">

      <div ref={containerRef} className="relative flex flex-col items-start">

        {/* 上の短い装飾線 */}
        <div ref={topLineRef} className="w-8 h-[0.5px] bg-black mb-6 opacity-70"></div>

        {/* タイトルエリア */}
        <div className="relative flex items-center h-[70px]">

          {/* 左端マーカー縦ライン（HUDのbendラインと同系統） */}
          <div
            ref={markerRef}
            className="absolute -left-4 top-0 w-[0.5px] h-full bg-black opacity-40"
          />

          {/* グリッチブロック × 5個 */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[
              { top: "15%", left: "0%", width: "55%", height: "2px" },
              { top: "40%", left: "5%", width: "35%", height: "1.5px" },
              { top: "60%", left: "0%", width: "70%", height: "2px" },
              { top: "75%", left: "10%", width: "25%", height: "1.5px" },
              { top: "28%", left: "2%", width: "45%", height: "1px" },
            ].map((g, i) => (
              <div
                key={i}
                ref={(el) => { glitchRefs.current[i] = el; }}
                className="absolute bg-black opacity-0"
                style={g}
              />
            ))}
          </div>

          {/* スキャンブロック（左→右へ走る黒い矩形） */}
          <div
            ref={scanBlockRef}
            className="absolute inset-0 bg-black z-20"
          />

          {/* タイトル本体（clipPathで左から露出） */}
          <div ref={titleClipRef} className="relative z-10">
            <h1 className="text-2xl leading-snug tracking-wider font-light text-black">
              Takakura Kazushi<br />
              Portfolio
            </h1>
          </div>

        </div>

        {/* 下の短い装飾線 */}
        <div ref={bottomLineRef} className="w-8 h-[0.5px] bg-black mt-6 opacity-70"></div>

      </div>

    </div>
  );
}