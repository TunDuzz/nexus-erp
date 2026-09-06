import { Plus } from "lucide-react";

export function EmptyState({ detail, title }: { detail: string; title: string }) {
  return (
    <div className="empty-state">
      <Plus aria-hidden="true" />
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  );
}
