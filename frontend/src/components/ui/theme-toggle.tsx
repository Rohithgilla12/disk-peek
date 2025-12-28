import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";
import { Button } from "./button";
import { motion, AnimatePresence } from "framer-motion";
import { springs } from "./motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./tooltip";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("system");
    } else {
      setTheme("dark");
    }
  };

  const getIcon = () => {
    if (theme === "system") {
      return Monitor;
    }
    return resolvedTheme === "dark" ? Moon : Sun;
  };

  const Icon = getIcon();
  const label =
    theme === "system"
      ? "System theme"
      : theme === "dark"
        ? "Dark theme"
        : "Light theme";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={cycleTheme}
          className="w-9 h-9 rounded-[var(--radius-md)] hover:bg-[var(--color-bg-hover)] relative overflow-hidden"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={theme}
              initial={{ y: -20, opacity: 0, rotate: -90 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: 20, opacity: 0, rotate: 90 }}
              transition={springs.snappy}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Icon size={18} className="text-[var(--color-text-muted)]" />
            </motion.span>
          </AnimatePresence>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{label}</p>
        <p className="text-[10px] text-[var(--color-text-muted)]">
          Click to cycle themes
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
