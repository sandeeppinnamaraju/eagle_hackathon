interface DataStateBannerProps {
  error: Error | null;
  message?: string;
  className?: string;
}

export function DataStateBanner({
  error,
  message = "Something went wrong. Please try again later.",
  className,
}: DataStateBannerProps) {
  if (!error) {
    return null;
  }

  return (
    <div
      role="alert"
      data-testid="data-state-error-banner"
      className={[
        "rounded-lg border border-warning/40 bg-warning-bg px-4 py-3 text-sm text-foreground",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {message}
    </div>
  );
}