import { useState } from "react";
import { z } from "zod";
import posthog from "posthog-js";
import type { Profile } from "@/types/portfolio";
import { Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().trim().min(1, "Name required").max(80),
  email: z.string().trim().email("Invalid email").max(160),
  message: z.string().trim().min(5, "Message too short").max(2000),
});

export function ContactForm({ profile }: { profile: Profile }) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        errs[i.path[0] as string] = i.message;
      });
      setErrors(errs);
      return;
    }
    setErrors({});
    posthog.capture("contact_form_submitted", {
      message_length: parsed.data.message.length,
    });
    const subject = `Portfolio inquiry from ${parsed.data.name}`;
    const body = `From: ${parsed.data.name} <${parsed.data.email}>\n\n${parsed.data.message}`;
    const url = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
    toast({ title: "Opening your email client…", description: `Sending to ${profile.email}` });
  }

  const inputCls =
    "w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-foreground focus:ring-0 placeholder:text-muted-foreground";

  return (
    <section className="paper rule animate-fade-in px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6">
        <h2 className="section-title">Contact</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sends via your default mail client to{" "}
          <span className="accent-text font-medium">{profile.email}</span>.
        </p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="text-xs uppercase tracking-widest text-muted-foreground">Name</label>
          <input
            id="contact-name"
            className={inputCls}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            maxLength={80}
          />
          {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="contact-email" className="text-xs uppercase tracking-widest text-muted-foreground">Email</label>
          <input
            id="contact-email"
            type="email"
            className={inputCls}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            maxLength={160}
          />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
        </div>
        <div className="md:col-span-2">
          <label htmlFor="contact-message" className="text-xs uppercase tracking-widest text-muted-foreground">Message</label>
          <textarea
            id="contact-message"
            rows={5}
            className={inputCls}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            maxLength={2000}
          />
          {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
        </div>
        <div className="md:col-span-2 flex justify-end">
          <button type="submit" className="chip flex items-center gap-1.5" data-active="true">
            <Send size={12} /> SEND MESSAGE
          </button>
        </div>
      </form>
    </section>
  );
}
