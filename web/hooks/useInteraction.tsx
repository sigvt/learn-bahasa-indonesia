import React, { useEffect, useRef } from "react";

export function useInteraction<T extends HTMLElement>(
  onIntersect: () => any,
  deps: React.DependencyList = []
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    console.log("useInteraction", ref.current);
    if (!ref.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        onIntersect();
      }
    });
    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return [ref];
}
