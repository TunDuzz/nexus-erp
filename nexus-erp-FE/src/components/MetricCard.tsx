import { ReactNode } from "react";
import { Package, Coins, AlertTriangle, FileText, LucideIcon } from "lucide-react";

type MetricTone = "green" | "amber" | "red" | "neutral";

const ToneIcons: Record<MetricTone, LucideIcon> = {
  green: Package,
  amber: Coins,
  red: AlertTriangle,
  neutral: FileText,
};

export function MetricCard({
  label,
  value,
  tone,
  description,
  icon: CustomIcon,
}: {
  label: string;
  value: string;
  tone: MetricTone;
  description?: ReactNode;
  icon?: LucideIcon;
}) {
  const Icon = CustomIcon || ToneIcons[tone];

  return (
    <article className={`metric-card ${tone}`}>
      <div className="metric-card-content">
        <span>{label}</span>
        <strong>{value}</strong>
        {description && <small>{description}</small>}
      </div>
      <div className="metric-icon-badge">
        <Icon size={20} />
      </div>
    </article>
  );
}
