export function AmbientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute bottom-[-15%] left-[-10%] h-[520px] w-[520px] rounded-full bg-info/20 blur-3xl" />
      <div className="absolute left-1/2 top-1/3 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-success/10 blur-3xl" />
    </div>
  );
}