export const inputCls =
  "w-full bg-transparent border border-border px-3 py-2 text-sm outline-none focus:border-foreground placeholder:text-muted-foreground";
export const labelCls = "block text-xs uppercase tracking-widest text-muted-foreground mb-1";

export function uid(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

export function move<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}
