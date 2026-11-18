# Requested updates and workflow polish

- Group Orders: removed the Thrifty Bite Assistant panel, welcome message, quick prompts, and associated client-side chatbot logic. Group invitations, group chat, and ordering controls remain.
- Menu: no background-music script is loaded. Home-page ambience remains separate.
- Voice ordering: expanded number words and regional conjunction handling; added a repeatable matcher test covering English, Tamil, Hindi, Kannada, Telugu and Malayalam examples. Matching only returns dishes that exist in the menu collection.
- Frontend: added a shared responsive polish stylesheet for consistent focus states, buttons, cards, spacing and small-screen layouts without replacing the existing wine/gold identity.
- Navigation: `/` now opens the home page instead of forcing the register page.
- Added `WORKFLOW-AND-VERIFICATION.md` and `PROJECT-ENHANCEMENT-ROADMAP.md`.

## Verification limits
Static JavaScript checks and the voice matcher unit tests can be run locally. Real cart persistence, voice capture, bookings, and feedback writes require the user's own `.env`, a running MongoDB cluster, and browser testing.
