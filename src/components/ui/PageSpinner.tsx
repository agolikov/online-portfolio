export function PageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-border border-t-foreground animate-spin" />
    </div>
  );
}
