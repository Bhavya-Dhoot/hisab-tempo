export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-ui bg-line/60 motion-reduce:animate-none ${className}`} />;
}
