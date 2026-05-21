# System Design Notes

<!-- Non-obvious decisions, constraints, trade-offs. E.g.:
- We use optimistic UI updates everywhere to feel fast — server errors roll back
- Auth tokens are stored in httpOnly cookies, not localStorage
- Background jobs run in-process via a simple queue, not a separate worker
-->

- PDF export uses jsPDF's built-in Helvetica font and simple max-width body text rendering. Body text is normalized, profile-summary text additionally strips control/bidi/invisible/unsupported Unicode characters, then prose is printed as wrapped text blocks instead of manually drawing each wrapped line.
- The public edit shortcut passes the current route in React Router state so the development-only editor Back button returns to the alias/hash route that opened it. Direct `/edit` visits fall back to `/`.
- Browser metadata uses the Online Resume name and a lucide-style `file-user` SVG favicon to match the resume/document focus.
