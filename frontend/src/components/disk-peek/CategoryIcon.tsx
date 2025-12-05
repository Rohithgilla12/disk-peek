import {
  Folder,
  Archive,
  Smartphone,
  Watch,
  Package,
  Database,
  Hexagon,
  Beer,
  Cog,
  GitBranch,
  Layers,
  Feather,
  Container,
  MonitorSmartphone,
  HardDrive,
  FileText,
  Hammer,
  TabletSmartphone,
  type LucideIcon,
} from "lucide-react";

interface CategoryIconProps {
  icon: string;
  color?: string;
  size?: number;
}

const iconMap: Record<string, LucideIcon> = {
  folder: Folder,
  archive: Archive,
  smartphone: Smartphone,
  watch: Watch,
  package: Package,
  database: Database,
  hexagon: Hexagon,
  beer: Beer,
  cog: Cog,
  "git-branch": GitBranch,
  layers: Layers,
  feather: Feather,
  container: Container,
  "monitor-smartphone": MonitorSmartphone,
  "hard-drive": HardDrive,
  "file-text": FileText,
  hammer: Hammer,
  "tablet-smartphone": TabletSmartphone,
};

export function CategoryIcon({ icon, color, size = 20 }: CategoryIconProps) {
  const IconComponent = iconMap[icon] || Folder;
  return <IconComponent size={size} color={color} />;
}
