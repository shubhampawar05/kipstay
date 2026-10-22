import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-full bg-secondary">
        <Icon className="size-6 text-primary" aria-hidden />
      </div>
      <h2 className="text-xl font-semibold">{title}</h2>
      {children && <div className="mt-2 text-muted-foreground">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
