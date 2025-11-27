import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  error?: boolean;
  loading?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, loading, disabled, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <input
          type={type}
          className={cn(
            // Base styles
            "flex h-10 w-full rounded-md border px-3 py-2 text-base ring-offset-background",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            "placeholder:text-muted-foreground",
            // Focus styles with YouTube red ring and smooth transitions
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "transition-all transition-normal",
            "focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_rgba(255,0,0,0.1)]",
            // Disabled state
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
            // Error state
            error && "border-destructive focus-visible:ring-destructive focus-visible:border-destructive",
            error && "focus-visible:shadow-[0_0_0_3px_rgba(255,0,0,0.2)]",
            // Loading state
            loading && "pr-10",
            // Responsive text size
            "md:text-sm",
            className
          )}
          ref={ref}
          disabled={disabled || loading}
          aria-invalid={error ? "true" : undefined}
          aria-busy={loading ? "true" : undefined}
          {...props}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              className="animate-spin h-4 w-4 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
