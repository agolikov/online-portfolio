# Data Models

## `resumes`
| Field | Type | Notes |
|-------|------|-------|
| `id` | serial | Primary key. |
| `hash` | varchar(10) | Unique public identifier generated from 5 random bytes. |
| `resumeData` | jsonb | Full portfolio/resume payload matching the frontend `Portfolio` type. |
| `note` | text | Internal owner note. Defaults to empty string. |
| `coverLetter` | text | Saved generated or manually edited cover letter. Defaults to empty string. |
| `enabled` | boolean | Controls whether `GET /api/resumes/:hash` is publicly readable. Defaults to true. |
| `createdAt` | timestamp | Creation timestamp. Defaults to current time. |

## `tech_suggestions`
| Field | Type | Notes |
|-------|------|-------|
| `id` | serial | Primary key. |
| `name` | varchar(100) | Unique technology name. |
| `category` | varchar(100) | Category used by editor autocomplete and portfolio grouping. |

## `chat_messages`
| Field | Type | Notes |
|-------|------|-------|
| `id` | serial | Primary key. |
| `resumeId` | integer | Foreign key to `resumes.id`; cascades on resume deletion. |
| `role` | varchar(20) | `user` or `assistant`. |
| `content` | text | Message body. |
| `toolsUsed` | jsonb | Assistant tool names displayed with the saved assistant message. Defaults to `[]`. |
| `createdAt` | timestamp | Creation timestamp. Defaults to current time. |

## `Portfolio` JSON
| Field | Type | Notes |
|-------|------|-------|
| `profile` | `Profile` | Required identity, contact, links, title, and summary. |
| `tech` | `Tech[]` | Required skills with category. |
| `experience` | `Experience[]` | Required roles, periods, highlights, and tech tags. |
| `projects` | `Project[]` | Required project cards and links. |
| `certificates` | `Certificate[]` | Required certifications. |
| `education` | `Education[]` | Optional education records. |
| `stories` | `Story[]` | Optional behavioral story records with per-story public visibility. |
| `coverLetters` | `PortfolioCoverLetters` | Optional cover-letter metadata attached to the portfolio JSON. |

## `Profile`
| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Person name. |
| `title` | string | Professional title. |
| `location` | string | Location. |
| `email` | string | Contact email. |
| `website` | string | Website URL. |
| `github` | string | GitHub URL. |
| `linkedin` | string | LinkedIn URL. |
| `summary` | string | Professional summary. |

## `Experience`
| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Stable frontend identifier. |
| `company` | string | Employer/client. |
| `role` | string | Role title. |
| `period` | string | Human-readable period. |
| `start` | string | ISO `YYYY-MM` or `YYYY`; used for tech-years calculation. |
| `end` | string | ISO `YYYY-MM`, `YYYY`, or `present`. |
| `location` | string | Location or remote marker. |
| `highlights` | string[] | Bullet achievements. |
| `tech` | string[] | Technologies used. |

## `Story`
| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Stable frontend identifier. |
| `question` | string | Prompt/question. |
| `answer` | string | Candidate answer. |
| `public` | boolean | Optional. Stories are public unless explicitly set to `false`. |

## `PortfolioCoverLetters`
| Field | Type | Notes |
|-------|------|-------|
| `current` | `PortfolioCoverLetter` | Optional current cover letter metadata. |

## `PortfolioCoverLetter`
| Field | Type | Notes |
|-------|------|-------|
| `content` | string | Cover letter text. Mirrored with the legacy `resumes.coverLetter` column for compatibility. |
| `summary` | string | Optional short candidate summary generated with the cover letter. |
| `vacancyText` | string | Optional role/vacancy text used for generation. |
| `metrics` | `CoverLetterMetric[]` | Optional role-fit metrics. |
| `generatedAt` | string | Optional ISO timestamp for AI-generated letters. |
| `updatedAt` | string | ISO timestamp for latest save. |

## `CoverLetterMetric`
| Field | Type | Notes |
|-------|------|-------|
| `id` | string | One of `techStack`, `experience`, `leadership`, or `overall`. |
| `label` | string | Display label. |
| `score` | number | Percentage score. |
| `summary` | string | Short explanation of the score. |
