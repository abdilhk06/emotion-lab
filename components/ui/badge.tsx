import * as React from "react";

function cx(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type BadgeProps = React.HTMLAttributes<HTMLSpanElement>;

function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border border-purple-100 bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 transition-colors",
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
