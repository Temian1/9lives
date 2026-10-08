# Controlled expansion plan

The October brief is a staged expansion, not a completed AAA feature list. This release focuses on stability, mobile customization and movement. Multiplayer remains inactive at the player's request.

## Delivered in this update

- House purchases close their blocking dialog, clear held input, charge once and persist asynchronously. Construction moves a player out of its new footprint when necessary. Older saves trapped in new property geometry recover without resetting the campaign.
- Character cameras frame the animated model from head to shoes. A visible fallback covers loading and model failures. Appearance controls scroll independently of the preview and Save button in portrait and landscape.
- Tap-to-walk uses bounded A* search and checked segments around buildings, parked vehicles, current traffic and people. Manual input cancels the route; stalled outdoor routes try replanning. Routes are temporary and do not alter campaign saves.
- A floating joystick appears on a hold or drag in the lower-left gameplay area and disappears on release, cancel or loss of focus. Separate camera fingers can orbit and pinch. Recenter, camera sensitivity, movement-zone settings and mission direction/distance are available.
- Pedestrians validate their sidewalk spawn points and steer around bodies with collision checks. The player cannot walk through these pedestrians or stationary shop/story NPCs. Follow-camera obstruction checks shorten the camera path before buildings.

## Next world and simulation phases

1. Complete NPC navigation and occupancy: persistent home/work schedules, dynamic patrol/guard capsules, navigation regions and group avoidance. Current sidewalk steering is local rather than a full navmesh.
2. Expand housing tiers and modular room layouts. Add construction previews, grid snapping, undo and doorway/furniture trap validation. Existing furniture placement and divider controls are prototypes.
3. Expand transport categories, traffic rules, vehicle ownership/theft witnesses and handling. Existing footprint/swept collisions, fuel, repairs and passenger views remain available.
4. Add the proposed chase minigame, evidence-based pursuit, jail/bail and faction relationships as playable systems.
5. Deepen careers, businesses, item effects, education, relationships and daily routines. Preserve current rent, resale, landlord notices, jobs, health and bank systems through migrations.
6. When requested, connect an automatically discovered shared world. Use an authoritative service with atomic, idempotent economy operations and persistent identities; no invitation codes in the final public flow. No shared service is active in this release.
7. Profile long mobile sessions on physical devices, then budget instancing, asset streaming, animation updates and texture memory. The bundled stylized CC0 models are not photorealistic assets.

## Validation

Run `npm test` for campaign, transport, purchases, save validation, landlord/economy rules, navigation, body avoidance, camera obstruction and future backend rules. Run `npm run build` for TypeScript and production bundling. Mobile browser checks cover character framing, dialog overflow, route movement, separate touch inputs and local deed persistence. Physical-device frame-rate and cross-device multiplayer have not been validated.
