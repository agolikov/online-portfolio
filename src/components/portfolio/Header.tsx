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
    <header className="paper px-4 py-6 md:px-10 md:py-12 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            {profile.name}
          </h1>
          <p className="mt-1.5 text-lg accent-text font-medium md:text-xl">{profile.title}</p>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {profile.email && (
            <a href={`mailto:${profile.email}`} className="flex items-center gap-1.5 hover:underline">
              <Mail size={14} className="accent-text shrink-0" /> {profile.email}
            </a>
          )}
          {profile.website && (
            <a href={`https://${profile.website}`} className="flex items-center gap-1.5 hover:underline">
              <Globe size={14} className="accent-text shrink-0" /> {profile.website}
            </a>
          )}
          {profile.github && (
            <a href={`https://${profile.github}`} className="flex items-center gap-1.5 hover:underline">
              <GithubIcon size={14} /> {profile.github.replace("github.com/", "")}
            </a>
          )}
          {profile.linkedin && (
            <a href={`https://${profile.linkedin}`} className="flex items-center gap-1.5 hover:underline">
              <Linkedin size={14} className="accent-text shrink-0" /> {profile.linkedin.replace("linkedin.com/in/", "")}
            </a>
          )}
          {profile.location && (
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="accent-text shrink-0" /> {profile.location}
            </span>
          )}
        </div>
      </div>

      <div className="rule mt-5 pt-4 md:mt-8 md:pt-6">
        <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
          {profile.summary}
        </p>
      </div>
    </header>
  );
}
