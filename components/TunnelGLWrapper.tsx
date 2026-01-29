"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";

interface TunnelGLWrapperProps {
  active: boolean;
}

export function TunnelGLWrapper({ active }: TunnelGLWrapperProps) {
  const { scene, camera, gl } = useThree();
  const tunnelRef = useRef<any>(null);

  useEffect(() => {
    if (!active) return;
    if (tunnelRef.current) return;

    const TunnelGL = (window as any).TunnelGL;
    if (!TunnelGL) return;

    tunnelRef.current = new TunnelGL({
      scene,
      camera,
      renderer: gl,
    });

    return () => {
      tunnelRef.current?.destroy?.();
      tunnelRef.current = null;
    };
  }, [active, scene, camera, gl]);

  return null;
}
