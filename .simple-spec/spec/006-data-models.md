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
| `isDefault` | boolean | Marks the enabled resume used by `/`. Defaults to false. Only one row should be set true by the API. |
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
| `experience` | `Experience[]` | Required roles, periods, highlights, tech tags, and per-entry `enabled` visibility. |
| `projects` | `Project[]` | Required project cards, links, and per-entry `enabled` visibility. |
| `certificates` | `Certificate[]` | Required certifications with per-entry `enabled` visibility. |
| `education` | `Education[]` | Optional education records with per-entry `enabled` visibility. |
| `stories` | `Story[]` | Optional behavioral story records with per-story `enabled` visibility. |
| `coverLetters` | `PortfolioCoverLetters` | Optional cover-letter metadata attached to the portfolio JSON with cover-letter `enabled` visibility. |

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
| `enabled` | boolean | Optional. Entry is visible on the public main page unless explicitly set to `false`. |
| `company` | string | Employer/client. |
| `role` | string | Role title. |
| `period` | string | Human-readable period. |
| `start` | string | ISO `YYYY-MM` or `YYYY`; used for tech-years calculation. |
| `end` | string | ISO `YYYY-MM`, `YYYY`, or `present`. |
| `location` | string | Location or remote marker. |
| `highlights` | string[] | Bullet achievements. |
| `tech` | string[] | Technologies used. |

## `Project`
| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Stable frontend identifier. |
| `enabled` | boolean | Optional. Entry is visible on the public main page unless explicitly set to `false`. |
| `name` | string | Project name. |
| `tagline` | string | Short project tagline. |
| `description` | string | Project description. |
| `link` | string | Project URL. |
| `tech` | string[] | Technologies used. |

## `Certificate`
| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Stable frontend identifier. |
| `enabled` | boolean | Optional. Entry is visible on the public main page unless explicitly set to `false`. |
| `name` | string | Certificate name. |
| `issuer` | string | Issuing organization. |
| `year` | string | Award year. |
| `credentialId` | string | Optional credential ID. |
| `link` | string | Optional verification URL. |
| `tech` | string[] | Optional related technologies. |

## `Education`
| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Stable frontend identifier. |
| `enabled` | boolean | Optional. Entry is visible on the public main page unless explicitly set to `false`. |
| `institution` | string | School or university name. |
| `shortName` | string | Optional short name. |
| `degree` | string | Degree or credential. |
| `field` | string | Field of study. |
| `period` | string | Human-readable period. |
| `start` | string | ISO `YYYY-MM` or `YYYY`. |
| `end` | string | ISO `YYYY-MM`, `YYYY`, or `present`. |
| `thesis` | string | Optional thesis text. |
| `skills` | string[] | Optional skills from the program. |

## `Story`
| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Stable frontend identifier. |
| `enabled` | boolean | Optional. Story is visible on the public main page unless explicitly set to `false`. |
| `question` | string | Prompt/question. |
| `answer` | string | Candidate answer. |
| `public` | boolean | Legacy optional visibility field. New data uses `enabled`. |

## `PortfolioCoverLetters`
| Field | Type | Notes |
|-------|------|-------|
| `current` | `PortfolioCoverLetter` | Optional current cover letter metadata. |

## `PortfolioCoverLetter`
| Field | Type | Notes |
|-------|------|-------|
| `content` | string | Cover letter text. Mirrored with the legacy `resumes.coverLetter` column for compatibility. |
| `enabled` | boolean | Optional. Cover letter appears on the public main page unless explicitly set to `false`. |
| `summary` | string | Optional short candidate summary generated with the cover letter. |
| `recipientName` | string | Optional hiring manager or recruiter name used for the greeting. |
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
