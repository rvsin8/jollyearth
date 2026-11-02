# Editorial and data workflow

Species records are fetched at build-preparation time by `python scripts/refresh-species.py`. Raw GBIF match/category responses are retained in `content/cache`. Exact species matches are required. Global IUCN risk categories are not confused with taxonomic acceptance or regional ESA legal status. Failed refreshes retain the last successful record and mark it stale. Population trends remain unknown unless a verified trend is added with its primary source.

Field Notes are individual JSON files in `content/field-notes`. The schema supports authored student submissions delivered offline to an editor. There is no student account, online submission or moderation surface.

Run `node scripts/compile-field-notes.mjs` to validate the files and generate the offline editor/review packet in `editor/field-notes-review.html`. That packet can filter drafts and research stubs, edit JSON and download a replacement file. It does not publish content or collect information.

The production data file contains only notes whose `editorial_status` is `approved`. Approval also requires a named human `reviewer`, `last_reviewed`, sources, a pull-out number and a 150–250-word narrative. Happening-now stories need an event date within three years. Machine source-checking is not human editorial approval. Never set review metadata without that review. References to unpublished notes are omitted from published read-alongside links.

The eight narrative drafts are ready for human review. The remaining seventeen briefs are explicit research stubs, with specific unresolved claims; they are excluded from public data. Alpine/desert coverage is an unresolved editorial decision, not an invitation to change the biological dataset.

Hotspot boundaries and old habitat baselines remain in `/public/data/hotspots.json`. Biome memberships are editorial and overlapping. Mapped areas are estimates based on simplified boundaries, not estimates of habitat remaining. Historical values must retain their dates when displayed.

The app adds no accounts, analytics, third-party embeds or identifiers. The hosting platform's existing owner-private access remains unchanged. Outbound source links use a departure notice before opening in a new tab. The print export keeps source URLs as plain text to avoid bypassing that notice.
