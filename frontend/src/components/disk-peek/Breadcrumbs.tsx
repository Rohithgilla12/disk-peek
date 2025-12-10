import { ChevronRight, Home } from "lucide-react";
import type { scanner } from "../../../wailsjs/go/models";

interface BreadcrumbItem {
  id: string;
  name: string;
  category?: scanner.Category;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate: (index: number) => void;
}

export function Breadcrumbs({ items, onNavigate }: BreadcrumbsProps) {
  if (items.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1.5 text-sm overflow-x-auto pb-1">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isFirst = index === 0;

        return (
          <div key={item.id} className="flex items-center gap-1.5 flex-shrink-0">
            {index > 0 && (
              <ChevronRight
                size={14}
                className="text-[var(--color-text-muted)] flex-shrink-0"
              />
            )}
            <button
              onClick={() => !isLast && onNavigate(index)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-lg)]
                transition-all duration-200 ease-out
                ${
                  isLast
                    ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)] font-semibold cursor-default"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-elevated)] border border-transparent hover:border-[var(--color-border)]"
                }
              `}
              disabled={isLast}
            >
              {isFirst && <Home size={14} className="flex-shrink-0" />}
              <span className="truncate max-w-[150px]">{item.name}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
