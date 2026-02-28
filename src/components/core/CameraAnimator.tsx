"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { usePortfolio } from "@/components/contexts/PortfolioContext";

/**
 * CameraAnimator — ロックオン時のカメラ制御
 *
 * 設計方針:
 *   ロックオン中は controls.update を no-op に差し替えることで
 *   TrackballControls との競合を完全に排除する。
 *   priority 引数を使わない（= R3F の自動レンダリングを維持）。
 */

type Phase = "idle" | "transition-in" | "tracking" | "transition-out";

const LERP_K = 3;            // 指数補間の速度係数
const IN_THRESHOLD = 0.1;    // 遷移イン到着判定
const OUT_THRESHOLD = 0.05;  // 遷移アウト到着判定

export function CameraAnimator({ controlsRef }: { controlsRef: any }) {
    const { activeSection } = usePortfolio();
    const { scene, camera } = useThree();

    const phase = useRef<Phase>("idle");
    const lockedSection = useRef<string | null>(null);
    const savedPos = useRef(new THREE.Vector3());
    const savedTarget = useRef(new THREE.Vector3());
    const savedUpdate = useRef<(() => void) | null>(null);
    const tmpV = useRef(new THREE.Vector3());
    const tmpL = useRef(new THREE.Vector3());

    useFrame((_, delta) => {
        const controls = controlsRef.current;
        if (!controls) return;

        /* ===== 状態遷移の検出 ===== */

        // (A) ロックオン要求 — idle or 復帰中に新セクションが選択された
        if (
            activeSection &&
            (phase.current === "idle" || phase.current === "transition-out")
        ) {
            if (phase.current === "idle") {
                // 初回: カメラ状態を退避し controls.update を無力化
                savedPos.current.copy(camera.position);
                savedTarget.current.copy(controls.target);
                savedUpdate.current = controls.update;
                controls.update = () => { };
            }
            // transition-out 中なら saved* / update 無効化は既にセット済み
            lockedSection.current = activeSection;
            phase.current = "transition-in";
        }

        // (B) ロックオン中にセクション変更
        if (
            activeSection &&
            lockedSection.current &&
            activeSection !== lockedSection.current &&
            (phase.current === "transition-in" || phase.current === "tracking")
        ) {
            lockedSection.current = activeSection;
            phase.current = "transition-in";
        }

        // (C) ロックオン解除要求
        if (
            !activeSection &&
            phase.current !== "idle" &&
            phase.current !== "transition-out"
        ) {
            phase.current = "transition-out";
        }

        /* ===== フェーズ実行 ===== */

        // ── 遷移イン / 追従 ──
        if (phase.current === "transition-in" || phase.current === "tracking") {
            const camA = scene.getObjectByName(
                `camera-anchor-${lockedSection.current}`
            );
            const lookA = scene.getObjectByName(
                `look-anchor-${lockedSection.current}`
            );
            if (!camA || !lookA) return;

            camA.getWorldPosition(tmpV.current);
            lookA.getWorldPosition(tmpL.current);

            if (phase.current === "transition-in") {
                const t = 1 - Math.exp(-LERP_K * delta);
                camera.position.lerp(tmpV.current, t);
                camera.up.set(0, 1, 0);
                camera.lookAt(tmpL.current);
                if (camera.position.distanceTo(tmpV.current) < IN_THRESHOLD) {
                    phase.current = "tracking";
                }
            } else {
                camera.position.copy(tmpV.current);
                camera.up.set(0, 1, 0);
                camera.lookAt(tmpL.current);
            }
            return;
        }

        // ── 遷移アウト（保存位置に復帰） ──
        if (phase.current === "transition-out") {
            const t = 1 - Math.exp(-LERP_K * delta);
            camera.position.lerp(savedPos.current, t);
            camera.up.set(0, 1, 0);
            camera.lookAt(savedTarget.current);

            if (camera.position.distanceTo(savedPos.current) < OUT_THRESHOLD) {
                // 到着: カメラ位置を確定し controls を復帰
                camera.position.copy(savedPos.current);
                camera.up.set(0, 1, 0);
                camera.lookAt(savedTarget.current);
                controls.target.copy(savedTarget.current);

                // controls.update を元に戻す
                if (savedUpdate.current) {
                    controls.update = savedUpdate.current;
                    savedUpdate.current = null;
                }
                lockedSection.current = null;
                phase.current = "idle";
            }
        }
    }); // ← priority 引数なし → R3F の自動レンダリングを阻害しない

    return null;
}