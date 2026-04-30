# PostHog post-wizard report

The wizard has completed a deep integration of your portfolio site. `posthog-js` was already installed and initialised in `src/main.tsx` — the integration extended it with targeted event captures across four components. Environment variables (`VITE_POSTHOG_KEY` and `VITE_POSTHOG_HOST`) were updated in `.env` to point to the correct EU PostHog host. No existing code was restructured; all additions are minimal and additive.

| Event | Description | File |
|---|---|---|
| `contact_form_submitted` | Fired on successful form validation and email client open — primary conversion event | `src/components/portfolio/ContactForm.tsx` |
| `pdf_exported` | Fired when the user clicks Export PDF | `src/components/portfolio/ControlBar.tsx` |
| `github_link_clicked` | Fired when the user clicks the GitHub link; includes `github_url` property | `src/components/portfolio/ControlBar.tsx` |
| `theme_mode_toggled` | Fired when the user toggles between Boring and Colorful modes; includes `mode` property | `src/components/portfolio/ControlBar.tsx` |
| `color_scheme_toggled` | Fired when the user switches dark/light scheme; includes `scheme` property | `src/components/portfolio/ControlBar.tsx` |
| `accent_changed` | Fired when the user picks an accent colour; includes `accent` property | `src/components/portfolio/ControlBar.tsx` |
| `tech_filter_applied` | Fired when a tech chip is clicked; includes `tech`, `category`, and `action` (added/removed) | `src/components/portfolio/TechFilter.tsx` |
| `tech_filter_cleared` | Fired when the Clear button is clicked; includes `cleared_count` and `cleared_tech` | `src/components/portfolio/TechFilter.tsx` |
| `project_link_clicked` | Fired when a project card's external link is opened; includes `project` and `project_url` | `src/components/portfolio/ProjectGrid.tsx` |

## Next steps

We've built a dashboard and five insights for you to keep an eye on visitor behaviour:

- **Dashboard — Analytics basics**: https://eu.posthog.com/project/169770/dashboard/653537
- **Contact Form Submissions** (line chart, daily): https://eu.posthog.com/project/169770/insights/OmCsYu2w
- **PDF Exports** (line chart, daily): https://eu.posthog.com/project/169770/insights/WRTot1DB
- **Visitor Engagement Funnel** (tech filter → project click → contact form): https://eu.posthog.com/project/169770/insights/pMvkseVJ
- **Top Clicked Projects** (bar chart, broken down by project name): https://eu.posthog.com/project/169770/insights/QH5ZJYNN
- **Most Filtered Tech Tags** (bar chart, broken down by tech tag): https://eu.posthog.com/project/169770/insights/uUnJbW9x

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-javascript_node/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
