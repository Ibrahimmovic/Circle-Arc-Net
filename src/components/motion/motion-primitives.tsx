"use client";

import { motion, useScroll, useTransform, type HTMLMotionProps } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import {
  fadeUpContainer,
  fadeUpItem,
  figmaSpringSnappy,
  hoverLift,
  scrollReveal,
  tapPress,
} from "@/design/motion-presets";

export function MotionFadeUp({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={fadeUpContainer}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}

export function MotionFadeUpItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={fadeUpItem}>
      {children}
    </motion.div>
  );
}

export function MotionScrollReveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={scrollReveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-8% 0px" }}
    >
      {children}
    </motion.div>
  );
}

export function MotionHoverCard({
  children,
  className,
  ...props
}: HTMLMotionProps<"div">) {
  return (
    <motion.div
      className={cn(className)}
      whileHover={hoverLift}
      whileTap={tapPress}
      transition={figmaSpringSnappy}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function MotionParallax({
  children,
  className,
  offset = 80,
}: {
  children: React.ReactNode;
  className?: string;
  offset?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, offset]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}
