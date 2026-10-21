"use client";

import { useEffect } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import type { Locale } from "@/lib/crm-data";

export default function ScoreGauge({
  score,
  locale,
}: {
  score: number;
  locale: Locale;
}) {
  const reducedMotion = useReducedMotion();
  const value = useMotionValue(0);
  const display = useTransform(value, (n) =>
    Math.round(n).toLocaleString(locale === "fa" ? "fa-IR" : "en-US"),
  );
  const progress = Math.max(0, Math.min(100, score)) / 100;

  useEffect(() => {
    const controls = animate(value, score, {
      duration: reducedMotion ? 0 : 1.15,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [score, reducedMotion, value]);

  return (
    <svg
      className="score-gauge mx-auto w-full max-w-[132px] overflow-visible"
      viewBox="0 0 260 146"
      role="img"
      aria-label={`${locale === "fa" ? "امتیاز لید" : "Lead score"}: ${score}/100`}
    >
      {Array.from({ length: 61 }, (_, index) => {
        const angle = Math.PI + (index / 60) * Math.PI;
        const inner = index % 5 === 0 ? 114 : 117;
        return (
          <line
            key={index}
            x1={(130 + Math.cos(angle) * inner).toFixed(3)}
            y1={(123 + Math.sin(angle) * inner).toFixed(3)}
            x2={(130 + Math.cos(angle) * 123).toFixed(3)}
            y2={(123 + Math.sin(angle) * 123).toFixed(3)}
            stroke={index / 60 <= progress ? "#37675a" : "#cdd6db"}
            strokeWidth={index % 5 === 0 ? 1.5 : 1}
          />
        );
      })}
      <path
        d="M 25 123 A 105 105 0 0 1 235 123"
        fill="none"
        stroke="#c4d9ce"
        strokeWidth="17"
      />
      <motion.path
        d="M 25 123 A 105 105 0 0 1 235 123"
        fill="none"
        stroke="#305b50"
        strokeWidth="17"
        initial={{ pathLength: reducedMotion ? progress : 0 }}
        animate={{ pathLength: progress }}
        transition={{
          duration: reducedMotion ? 0 : 1.15,
          ease: [0.22, 1, 0.36, 1],
        }}
      />
      <motion.text
        x="130"
        y="91"
        textAnchor="middle"
        className="fill-[#203540] text-[43px] font-normal tracking-[-2px]"
      >
        {display}
      </motion.text>
      <text
        x="130"
        y="110"
        textAnchor="middle"
        className="fill-[#38594f] text-xs"
      >
        {locale === "fa" ? "از ۱۰۰ امتیاز" : "out of 100"}
      </text>
      <path d="M 116 138 A 14 14 0 0 1 144 138" fill="#e7edef" />
      <g transform="translate(130 138)">
        <motion.g
          initial={{ rotate: reducedMotion ? progress * 180 - 90 : -90 }}
          animate={{ rotate: progress * 180 - 90 }}
          transition={{
            duration: reducedMotion ? 0 : 1.15,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ transformOrigin: "0px 0px" }}
        >
          <path d="M -4 0 L 0 -19 L 4 0 Z" fill="#305b50" />
        </motion.g>
      </g>
      <circle cx="130" cy="138" r="3" fill="#344d5a" />
      <text
        x="18"
        y="143"
        textAnchor="middle"
        className="fill-[#416355] text-xs"
      >
        0
      </text>
      <text
        x="242"
        y="143"
        textAnchor="middle"
        className="fill-[#416355] text-xs"
      >
        100
      </text>
    </svg>
  );
}
