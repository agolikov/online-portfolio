import type { Profile } from "@/types/portfolio";
import { Mail, MapPin, Globe, Github, Linkedin } from "lucide-react";

export function Header({ profile }: { profile: Profile }) {
  return (
    <header className="paper px-6 py-8 md:px-10 md:py-12 animate-fade-in">
      <p className="mb-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
        Interactive Resume
      </p>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            {profile.name}
          </h1>
          <p className="mt-2 text-lg accent-text md:text-xl">{profile.title}</p>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <a href={`mailto:${profile.email}`} className="flex items-center gap-1.5 hover:underline">
            <Mail size={14} /> {profile.email}
          </a>
          <a href={`https://${profile.website}`} className="flex items-center gap-1.5 hover:underline">
            <Globe size={14} /> {profile.website}
          </a>
          <a href={`https://${profile.github}`} className="flex items-center gap-1.5 hover:underline">
            <Github size={14} /> {profile.github.replace("github.com/", "")}
          </a>
          <a href={`https://${profile.linkedin}`} className="flex items-center gap-1.5 hover:underline">
            <Linkedin size={14} /> {profile.linkedin.replace("linkedin.com/in/", "")}
          </a>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin size={14} /> {profile.location}
          </span>
        </div>
      </div>

      <div className="rule mt-8 pt-6">
        <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
          {profile.summary}
        </p>
      </div>
    </header>
  );
}
