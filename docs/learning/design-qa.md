# Design QA

Final result: **blocked** for rendered visual acceptance. Implementation and non-browser checks are complete; the task's full definition of done is not claimed.

## References inspected

- Habitat Detective mobile: supplied 852×1846 raster, target 393×852 CSS viewport.
- Rain Lab desktop: supplied 1487×1058 raster, target 1440×1024.
- Field Journal desktop: supplied 1487×1058 raster, target 1440×1024.
- Seven exported 393×852 mobile references: Discover, Map, waterfront map, park, history, cleanup, planned.

All were opened before their corresponding implementation. Browser/iOS/ChatGPT chrome was excluded. Figma file V815hZ95xNrCPsDoqmSPOs could not be inspected because the Figma MCP Starter-plan limit was reached. No separate exported layer-dialog frame was present: that dialog follows the available tokens and requirements, not an unseen claimed match.

## Outstanding actual screenshot comparisons

|Screen/state|Viewport|Result|
|---|---|---|
|Detective correct answer selected after interaction|393×852|Blocked: browser permission|
|Rain Lab prediction screen|1440×1024|Blocked: browser permission|
|Journal practice entry|1440×1024|Blocked: browser permission|
|Map and selected park|393×852|Blocked: browser permission|
|Timeline, all three stages|393×852|Blocked: browser permission|

No reference-versus-build montage or recording is supplied: that would falsely imply rendered validation. Prepared Playwright journeys capture actual screenshots once execution is authorized. Additional width checks: 360, 768 and 1440.

## Known differences and decisions

- Journal sample reflection text is shown as placeholders and in an example dialog, not as learner-entered saved content. This prevents sample work being mistaken for a real observation.
- Common tern photo is cropped from the approved reference because the full original Commons image download returned HTTP403. Source/photographer/date/share-alike license are retained. Expand opens that available resolution, not an invented high-resolution original.
- Existing verified NJDEP/FEMA geography is retained instead of replacing it with the reference's OSM map rendering. Labels and geometry therefore differ; data provenance remains accurate.
- Layer drawer uses compact controls and a Done button, but its exact Figma frame was inaccessible.
- Cleanup and planned-state visuals are extracted concept illustrations from approved exported references and explicitly labelled accordingly. No completed-restoration photograph is fabricated.
- A pavement-only scene is an AI-assisted variant of the approved rain illustration. It is an illustration, not evidence of real weather or actual drainage behavior.
- Model results appear as differentiated labelled states, not a simulated physical fluid animation.
- Supplemental storage notice, source details and saved-entry list sit outside the principal reference composition.

Remaining typography wrapping, image crop, spacing, alignment and mobile overflow differences cannot be reliably enumerated without actual browser renders. No pixel-match claim is made.
