import { useEffect, useRef, useState } from "react";

export function SimulatorFrame() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(880);

  useEffect(() => {
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
  }, []);

  return (
    <iframe
      ref={frameRef}
      className="simulator-frame"
      src="/simulators/rcp/index.html"
      title="Megacode do Prof. Victor — simulação de RCP"
      style={{ height }}
    />
  );
}
