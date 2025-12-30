"use client";

import * as React from "react";
import { motion, stagger, useAnimate } from "motion/react";
import { cn } from "@/lib/utils";

type TextGenerateEffectProps = Omit<React.ComponentProps<"div">, "children"> & {
  words: string;
  filter?: boolean;
  duration?: number;
  staggerDelay?: number;
};

function TextGenerateEffect({
  ref,
  words,
  className,
  filter = true,
  duration = 0.5,
  staggerDelay = 0.2,
  ...props
}: TextGenerateEffectProps) {
  const localRef = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(
    ref as any,
    () => localRef.current as HTMLDivElement
  );

  const [scope, animate] = useAnimate();
  const [hasAnimated, setHasAnimated] = React.useState(false);
  const wordsArray = React.useMemo(() => words.split(" "), [words]);

  React.useEffect(() => {
    if (!localRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated && scope.current) {
            animate(
              "span",
              {
                opacity: 1,
                filter: filter ? "blur(0px)" : "none",
              },
              {
                duration: duration,
                delay: stagger(staggerDelay),
              }
            );
            setHasAnimated(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(localRef.current);

    return () => {
      if (localRef.current) {
        observer.unobserve(localRef.current);
      }
    };
  }, [animate, duration, filter, hasAnimated, scope, staggerDelay]);

  return (
    <div
      ref={localRef}
      className={cn("font-bold", className)}
      data-slot="text-generate-effect"
      {...(props as any)}
    >
      <motion.div ref={scope}>
        {wordsArray.map((word, idx) => (
          <motion.span
            key={`${word}-${idx}`}
            className="opacity-0 will-change-transform will-change-opacity will-change-filter"
            style={{
              filter: filter ? "blur(10px)" : "none",
            }}
          >
            {word}{" "}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}

export { TextGenerateEffect, type TextGenerateEffectProps };
