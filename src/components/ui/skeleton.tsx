import { cn } from "cn"

function Skeleton({ className, index = 0, style, ...props }: React.ComponentProps<"div"> & { index?: number }) {
  return (
    <div
      data-slot="skeleton"
      className={cn("kip-shimmer rounded-md", className)}
      style={{ "--shimmer-index": index, ...style } as React.CSSProperties}
      {...props}
    />
  )
}

export { Skeleton }
