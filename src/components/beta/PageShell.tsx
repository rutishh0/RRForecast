// V5/src/components/beta/PageShell.tsx
import type { ReactNode } from "react";

export function PageShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="px-6 py-6 max-w-[1480px] mx-auto">
      <div className="flex items-start justify-between gap-6 mb-6">
        <div className="min-w-0">
          <h1 className="text-[20px] font-semibold tracking-tight leading-tight text-foreground">{title}</h1>
          {description && (
            <p className="text-[13px] text-muted-foreground mt-1 max-w-[640px] text-pretty">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className = "",
  padded = true,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={`bg-surface border border-border rounded-md overflow-hidden ${className}`}>
      {(title || actions) && (
        <header className="px-4 h-11 flex items-center justify-between border-b border-border">
          <div className="min-w-0">
            {title && <h2 className="text-[13px] font-medium leading-tight truncate text-foreground">{title}</h2>}
            {description && (
              <p className="text-[11px] text-muted-foreground leading-tight truncate">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </header>
      )}
      <div className={padded ? "p-4" : ""}>{children}</div>
    </section>
  );
}
