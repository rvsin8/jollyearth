# Navigation and code cleanup

The four primary journeys are Explore, Living collection, Jersey City and Plant lab. Supporting tools remain at their original URLs under Tools & resources (Tools on mobile). Active resource pages expand their section automatically. Mobile Tools closes on navigation/search and supports Escape with focus return. The repeated sidebar promotion has been removed; its original image is preserved.

No usage analytics were available. Features were grouped by purpose, not declared unused based on assumptions. Existing exhibits, animal profiles, comparison, student submissions, sources, diagrams and original artwork remain.

## Code boundaries

- `site-navigation.tsx`: typed shared route registry and navigation components; mobile and desktop use one source of truth.
- `external-link.tsx`: outbound-link policy and confirmation provider, independent of page content.
- `evidence.tsx`: source citations and conservation chips, independent of page content.
- `guide-views.tsx`: page content only; shared shell no longer imports it.
- Removed 52 unreferenced starter UI modules after following imports from application, scripts and tests, including transitive UI imports. Retained nine used UI modules. Removed unused imports from the atlas and shell.
- Left dependencies and lockfile unchanged; dependency pruning requires its own build-tool and script audit. Historical CSS consolidation is also deferred rather than risking visual regressions without browser access.

## Validation

TypeScript, navigation rendering assertions, registry/URL checks, discovery search and asset preservation checks, 13 exhibit lifecycle checks, production build. Navigation rendering tests are server-side, not browser tests. Browser access was previously denied by the permission gate; no visual, touchscreen, console, GPU or screenshot result is claimed.
