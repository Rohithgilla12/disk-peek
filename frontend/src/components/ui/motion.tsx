import { motion, type HTMLMotionProps, type Variants, AnimatePresence } from "framer-motion";
import { forwardRef } from "react";

// Spring configurations for different use cases
export const springs = {
  // Snappy, responsive feel
  snappy: { type: "spring", stiffness: 400, damping: 30 } as const,
  // Smooth, gentle motion
  smooth: { type: "spring", stiffness: 300, damping: 25 } as const,
  // Bouncy, playful
  bouncy: { type: "spring", stiffness: 500, damping: 15 } as const,
  // Soft, slow motion
  soft: { type: "spring", stiffness: 200, damping: 20 } as const,
};

// Common animation variants
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.smooth
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.15 }
  }
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 }
  }
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springs.snappy
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 }
  }
};

export const slideInFromRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: springs.smooth
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.15 }
  }
};

export const slideInFromLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: springs.smooth
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.15 }
  }
};

// Stagger children animation
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.smooth
  }
};

// Card hover effect
export const cardHover = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: springs.snappy
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 }
  }
};

// Button press effect
export const buttonPress = {
  tap: {
    scale: 0.97,
    transition: { duration: 0.1 }
  }
};

// Pulse animation
export const pulse: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Glow animation for scanning state
export const scanGlow: Variants = {
  initial: {
    boxShadow: "0 0 0 0 rgba(59, 130, 246, 0)"
  },
  animate: {
    boxShadow: [
      "0 0 0 0 rgba(59, 130, 246, 0.4)",
      "0 0 20px 10px rgba(59, 130, 246, 0)",
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeOut"
    }
  }
};

// Motion div with common props
export const MotionDiv = motion.div;
export const MotionButton = motion.button;
export const MotionSpan = motion.span;

// Animated list container
interface AnimatedListProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

export const AnimatedList = forwardRef<HTMLDivElement, AnimatedListProps>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      {...props}
    >
      {children}
    </motion.div>
  )
);
AnimatedList.displayName = "AnimatedList";

// Animated list item
interface AnimatedListItemProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

export const AnimatedListItem = forwardRef<HTMLDivElement, AnimatedListItemProps>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={staggerItem}
      {...props}
    >
      {children}
    </motion.div>
  )
);
AnimatedListItem.displayName = "AnimatedListItem";

// Fade in wrapper
interface FadeInProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
}

export const FadeIn = forwardRef<HTMLDivElement, FadeInProps>(
  ({ children, delay = 0, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.smooth, delay }}
      {...props}
    >
      {children}
    </motion.div>
  )
);
FadeIn.displayName = "FadeIn";

// Scale in wrapper (great for icons and buttons)
interface ScaleInProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
}

export const ScaleIn = forwardRef<HTMLDivElement, ScaleInProps>(
  ({ children, delay = 0, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...springs.bouncy, delay }}
      {...props}
    >
      {children}
    </motion.div>
  )
);
ScaleIn.displayName = "ScaleIn";

// Re-export AnimatePresence for convenience
export { AnimatePresence };
