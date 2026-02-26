import { LeftMask } from "@/components/layout/LeftMask";
import RightCanvasArea from "@/components/layout/RightCanvasArea";

export default function Home() {
  return (
    // flexを指定することで、中の要素（LeftMaskとRightCanvasArea）が横に並びます
    <main className="flex w-screen h-screen overflow-hidden bg-white text-black">
      <LeftMask />
      <RightCanvasArea />
    </main>
  );
}