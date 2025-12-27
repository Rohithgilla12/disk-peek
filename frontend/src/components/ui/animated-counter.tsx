import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  formatFn?: (value: number) => string;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 1000,
  formatFn = (v) => v.toFixed(0),
  className = "",
}: AnimatedCounterProps) {
  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    duration: duration / 1000,
  });

  const display = useTransform(spring, (latest) => formatFn(latest));
  const [displayValue, setDisplayValue] = useState(formatFn(0));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsubscribe = display.on("change", (v) => setDisplayValue(v));
    return unsubscribe;
  }, [display]);

  return (
    <motion.span className={className}>
      {displayValue}
    </motion.span>
  );
}

interface AnimatedSizeProps {
  bytes: number;
  className?: string;
  duration?: number;
}

export function AnimatedSize({ bytes, className = "", duration = 800 }: AnimatedSizeProps) {
  const [displayData, setDisplayData] = useState(() => formatSizeWithUnit(bytes));
  const prevBytesRef = useRef(bytes);

  const spring = useSpring(bytes, {
    stiffness: 80,
    damping: 25,
  });

  useEffect(() => {
    spring.set(bytes);
    prevBytesRef.current = bytes;
  }, [spring, bytes]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      setDisplayData(formatSizeWithUnit(latest));
    });
    return unsubscribe;
  }, [spring]);

  return (
    <span className={className}>
      <motion.span
        key={displayData.unit}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {displayData.value}
      </motion.span>
      <span className="ml-1 text-[0.85em] opacity-80">{displayData.unit}</span>
    </span>
  );
}

function formatSizeWithUnit(bytes: number): { value: string; unit: string } {
  if (bytes === 0) return { value: "0", unit: "B" };
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  const formatted = value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2);
  return { value: formatted, unit: sizes[i] };
}
