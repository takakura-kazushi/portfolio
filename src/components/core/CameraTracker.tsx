import { useThree, useFrame } from "@react-three/fiber";

interface CameraTrackerProps {
  onUpdate: (position: { x: number; y: number; z: number }, rotation: number) => void;
}

export function CameraTracker({ onUpdate }: CameraTrackerProps) {
  const { camera } = useThree();

  useFrame(() => {
    // Get camera position
    const position = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    };

    // Get camera y-axis rotation in degrees
    const rotation = (camera.rotation.y * 180) / Math.PI;

    onUpdate(position, rotation);
  });

  return null;
}
