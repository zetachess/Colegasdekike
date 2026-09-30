"use client";

import { useEffect, useState } from "react";

type NumberTickerProps = {
  value: number;
  duration?: number;
  delay?: number;
};

const numberFormat = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });

export default function NumberTicker({ value, duration = 2000, delay = 0 }: NumberTickerProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frameId = window.requestAnimationFrame(() => setDisplayValue(value));
      return () => window.cancelAnimationFrame(frameId);
    }

    let animationId = 0;
    const timeoutId = window.setTimeout(() => {
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setDisplayValue(value * easeOutQuart);

        if (progress < 1) animationId = requestAnimationFrame(animate);
      };

      animationId = requestAnimationFrame(animate);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(animationId);
    };
  }, [value, duration, delay]);

  return (
    <>
      <span aria-hidden="true">{numberFormat.format(Math.round(displayValue))}</span>
      <span className="visually-hidden">{numberFormat.format(value)}</span>
    </>
  );
}
