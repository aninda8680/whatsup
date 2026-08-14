import { SVGProps } from "react";
import { motion, SVGMotionProps } from "framer-motion";

interface MascotProps extends SVGMotionProps<SVGSVGElement> {
  emotion?: "happy" | "wow" | "sad";
  className?: string;
}

export function Mascot({ emotion = "happy", className, ...props }: MascotProps) {
  // A chunky neo-brutalist chat bubble mascot with thick lines
  return (
    <motion.svg
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Body: Chat Bubble Shape */}
      <path
        d="M20 20C20 8.954 28.954 10 40 10H60C71.046 10 80 18.954 80 30V60C80 71.046 71.046 80 60 80H45L30 95V80H30C18.954 80 10 71.046 10 60V30C10 24 15 20 20 20Z"
        fill="#FFD600"
        stroke="#111827"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Eyes */}
      {emotion === "sad" ? (
        <>
          <line x1="30" y1="35" x2="40" y2="45" stroke="#111827" strokeWidth="6" strokeLinecap="round" />
          <line x1="40" y1="35" x2="30" y2="45" stroke="#111827" strokeWidth="6" strokeLinecap="round" />
          <line x1="55" y1="35" x2="65" y2="45" stroke="#111827" strokeWidth="6" strokeLinecap="round" />
          <line x1="65" y1="35" x2="55" y2="45" stroke="#111827" strokeWidth="6" strokeLinecap="round" />
        </>
      ) : emotion === "wow" ? (
        <>
          <circle cx="35" cy="40" r="6" fill="#111827" />
          <circle cx="60" cy="40" r="6" fill="#111827" />
          <circle cx="47.5" cy="60" r="8" fill="#111827" />
        </>
      ) : (
        // happy
        <>
          <circle cx="35" cy="40" r="5" fill="#111827" />
          <circle cx="60" cy="40" r="5" fill="#111827" />
          <path d="M40 55 Q 47.5 65 55 55" stroke="#111827" strokeWidth="5" strokeLinecap="round" fill="none" />
        </>
      )}

      {/* Stick Legs */}
      <path d="M35 85 V110" stroke="#111827" strokeWidth="6" strokeLinecap="round" />
      <path d="M60 85 V110" stroke="#111827" strokeWidth="6" strokeLinecap="round" />
      
      {/* Feet */}
      <path d="M35 110 H25" stroke="#111827" strokeWidth="6" strokeLinecap="round" />
      <path d="M60 110 H70" stroke="#111827" strokeWidth="6" strokeLinecap="round" />
    </motion.svg>
  );
}
