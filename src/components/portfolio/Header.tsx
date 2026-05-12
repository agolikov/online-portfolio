import type { Profile } from "@/types/portfolio";
import { Mail, MapPin, Globe, Linkedin } from "lucide-react";

function GithubIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="accent-text shrink-0">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.111.82-.261.82-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23a11.509 11.509 0 0 1 3.004-.404c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export function Header({ profile }: { profile: Profile }) {
  return (
    <header className="paper animate-fade-in px-4 py-6 md:px-6 md:py-8">
      <div className="grid gap-5 md:grid-cols-[minmax(0,0.85fr)_minmax(280px,1fr)] md:items-end">
        <div>
          <div className="flex max-w-sm flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
              {profile.name}
            </h1>
            {import.meta.env.DEV && (
              <span className="rounded border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-destructive">
                DEV
              </span>
            )}
          </div>
          <p className="accent-text mt-2 text-lg font-medium md:text-xl">{profile.title}</p>
        </div>

        <div className="grid gap-x-5 gap-y-2 text-sm text-muted-foreground sm:grid-cols-2">
          {profile.email && (
            <a href={`mailto:${profile.email}`} className="flex min-w-0 items-center gap-2 hover:text-foreground">
              <Mail size={14} className="accent-text shrink-0" /> {profile.email}
            </a>
          )}
          {profile.website && (
            <a href={`https://${profile.website}`} className="flex min-w-0 items-center gap-2 hover:text-foreground">
              <Globe size={14} className="accent-text shrink-0" /> {profile.website}
            </a>
          )}
          {profile.github && (
            <a href={`https://${profile.github}`} className="flex min-w-0 items-center gap-2 hover:text-foreground">
              <GithubIcon size={14} /> {profile.github.replace("github.com/", "")}
            </a>
          )}
          {profile.linkedin && (
            <a href={`https://${profile.linkedin}`} className="flex min-w-0 items-center gap-2 hover:text-foreground">
              <Linkedin size={14} className="accent-text shrink-0" /> {profile.linkedin.replace("linkedin.com/in/", "")}
            </a>
          )}
          {profile.location && (
            <span className="flex min-w-0 items-center gap-2 sm:col-span-2">
              <MapPin size={14} className="accent-text shrink-0" /> {profile.location}
            </span>
          )}
        </div>
      </div>

      <div className="rule mt-6 pt-5 md:mt-8 md:pt-6">
        <p className="max-w-4xl text-base leading-7 text-muted-foreground md:text-lg">
          {profile.summary}
        </p>
      </div>
    </header>
  );
}
