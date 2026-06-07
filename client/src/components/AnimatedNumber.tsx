import { useEffect, useRef } from 'react';
import { motion, useSpring } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  className?: string;
  format?: boolean;
  prefix?: string;
  suffix?: string;
}

export function AnimatedNumber({
  value,
  className = '',
  format = true,
  prefix = '',
  suffix = '',
}: AnimatedNumberProps) {
  const springValue = useSpring(0, { stiffness: 60, damping: 20 });
  const prevValue = useRef(0);

  useEffect(() => {
    springValue.set(value);
    prevValue.current = value;
  }, [value, springValue]);

  const displayValue = (v: number) => {
    const num = Math.round(v);
    return format ? num.toLocaleString() : String(num);
  };

  return (
    <span className={className}>
      {prefix}
      <motion.span>{springValue}</motion.span>
      {suffix}
    </span>
  );
}
