import { useEffect, useRef, useState } from "react";

type SimulatorFrameProps = {
  src?: string;
  title?: string;
  fixedViewport?: boolean;
};

export function SimulatorFrame({
  src = "/simulators/rcp/index.html",
  title = "Megacode do Prof. Victor — simulação de RCP",
  fixedViewport = false,
}: SimulatorFrameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(880);

  useEffect(() => {
    // Viewport-based simulators keep their own scroll area: automatically growing
    // an iframe whose content uses vh would feed its height back into itself.
    if (fixedViewport) return;
    const frame = frameRef.current;
    if (!frame) return;

    let resizeObserver: ResizeObserver | undefined;

    const updateHeight = () => {
      const documentElement = frame.contentDocument?.documentElement;
      const body = frame.contentDocument?.body;
      if (!documentElement || !body) return;
      const nextHeight = Math.max(
        720,
        documentElement.scrollHeight,
        body.scrollHeight,
      );
      setHeight(nextHeight + 8);
    };

    const handleLoad = () => {
      updateHeight();
      const body = frame.contentDocument?.body;
      if (body) {
        resizeObserver = new ResizeObserver(updateHeight);
        resizeObserver.observe(body);
      }
    };

    frame.addEventListener("load", handleLoad);
    return () => {
      frame.removeEventListener("load", handleLoad);
      resizeObserver?.disconnect();
    };
  }, [src, fixedViewport]);

  return (
    <iframe
      ref={frameRef}
      className="simulator-frame"
      src={src}
      title={title}
      style={{ height: fixedViewport ? "max(720px, 85svh)" : height }}
    />
  );
}
