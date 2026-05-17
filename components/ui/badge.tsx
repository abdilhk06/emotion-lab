import * as React from "react";

function cx(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type BadgeProps = React.HTMLAttributes<HTMLSpanElement>;

function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cx("badge", className)}
      {...props}
    />
  );
}

export { Badge };
