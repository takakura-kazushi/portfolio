"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { usePortfolio } from "@/components/contexts/PortfolioContext";

type Phase = "idle" | "transition-in" | "tracking" | "transition-out";

const LERP_K = 4;
const IN_THRESHOLD = 0.05;
const OUT_THRESHOLD = 0.05;

export function CameraAnimator({ controlsRef }: { controlsRef: any }) {
    const { activeSection } = usePortfolio();
    const { scene, camera } = useThree();

    const phase = useRef<Phase>("idle");
    const lockedSection = useRef<string | null>(null);
    const savedPos = useRef(new THREE.Vector3());
    const savedTarget = useRef(new THREE.Vector3());
    const savedUp = useRef(new THREE.Vector3());
    const savedUpdate = useRef<(() => void) | null>(null);
    const tmpV = useRef(new THREE.Vector3());
    const tmpL = useRef(new THREE.Vector3());
    const tmpUp = useRef(new THREE.Vector3());

    useFrame((_, delta) => {
        const controls = controlsRef.current;
        if (!controls) return;

        // (A) ロックオン要求
        if (
            activeSection &&
            (phase.current === "idle" || phase.current === "transition-out")
        ) {
            if (phase.current === "idle") {
                savedPos.current.copy(camera.position);
                savedTarget.current.copy(controls.target);
                savedUp.current.copy(camera.up);
                savedUpdate.current = controls.update;
                controls.update = () => { };
            }
            lockedSection.current = activeSection;
            phase.current = "transition-in";
        }

        // (B) セクション変更
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

        // ── 遷移イン / 追従 ──
        if (phase.current === "transition-in" || phase.current === "tracking") {
            const camA = scene.getObjectByName(`camera-anchor-${lockedSection.current}`);
            const lookA = scene.getObjectByName(`look-anchor-${lockedSection.current}`);
            const upA = scene.getObjectByName(`up-anchor-${lockedSection.current}`);

            if (!camA || !lookA || !upA) return;

            camA.getWorldPosition(tmpV.current);
            lookA.getWorldPosition(tmpL.current);
            upA.getWorldPosition(tmpUp.current);

            // 多面体の回転に合わせた理想のUpベクトルを算出
            const targetUp = tmpUp.current.sub(tmpV.current).normalize();

            if (phase.current === "transition-in") {
                const t = 1 - Math.exp(-LERP_K * delta);
                camera.position.lerp(tmpV.current, t);
                camera.up.lerp(targetUp, t).normalize(); // カメラの天地も同期させる
                camera.lookAt(tmpL.current);

                if (camera.position.distanceTo(tmpV.current) < IN_THRESHOLD) {
                    phase.current = "tracking";
                }
            } else {
                camera.position.copy(tmpV.current);
                camera.up.copy(targetUp); // 完全追従時は値をコピー
                camera.lookAt(tmpL.current);
            }
            return;
        }

        // ── 遷移アウト（保存位置に復帰） ──
        if (phase.current === "transition-out") {
            const t = 1 - Math.exp(-LERP_K * delta);
            camera.position.lerp(savedPos.current, t);
            camera.up.lerp(savedUp.current, t).normalize(); // 天地を元に戻す
            camera.lookAt(savedTarget.current);

            if (camera.position.distanceTo(savedPos.current) < OUT_THRESHOLD) {
                camera.position.copy(savedPos.current);
                camera.up.copy(savedUp.current);
                camera.lookAt(savedTarget.current);
                controls.target.copy(savedTarget.current);

                if (savedUpdate.current) {
                    controls.update = savedUpdate.current;
                    savedUpdate.current = null;
                }
                lockedSection.current = null;
                phase.current = "idle";
            }
        }
    });

    return null;
}