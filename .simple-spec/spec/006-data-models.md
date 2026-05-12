# Data Models

## Portfolio JSON (`resumeData` JSONB column)

### `Project`
| Field | Type | Notes |
|-------|------|-------|
| `id` | string | unique within resume |
| `enabled` | boolean \| `"visible"` \| `"hidden"` | visibility flag |
| `name` | string | display name |
| `tagline` | string | one-liner |
| `description` | string | longer description |
| `link` | string | bare hostname or URL (no `https://`) |
| `tech` | string[] | tech tags |
| `year` | string? | optional publication / launch year |

### `PortfolioSettings`
| Field | Type | Notes |
|-------|------|-------|
| `hideYears` | boolean? | suppresses year badges on projects, certs, and education in public view and PDF |

### `Portfolio` (top-level)
| Field | Type | Notes |
|-------|------|-------|
| `profile` | Profile | name, title, location, email, website, github, linkedin, summary |
| `tech` | Tech[] | skills list grouped by category |
| `experience` | Experience[] | work history |
| `projects` | Project[] | side projects |
| `certificates` | Certificate[] | certifications |
| `education` | Education[] | education entries |
| `stories` | Story[]? | behavioral Q&A entries |
| `coverLetters` | CoverLetters? | `current` cover letter blob |
| `settings` | PortfolioSettings? | per-resume display settings |

## `resumes` DB table
| Column | Type | Notes |
|--------|------|-------|
| `id` | serial | primary key |
| `hash` | varchar(12) | unique public identifier |
| `alias` | varchar(100) | optional unique user-defined slug |
| `resume_data` | jsonb | Portfolio JSON |
| `enabled` | boolean | public access toggle |
| `is_default` | boolean | serves as the home-page default when true |
| `note` | text? | internal note visible only in the editor |
| `created_at` | timestamp | creation time |
