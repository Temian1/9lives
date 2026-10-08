# Controlled expansion plan

The original MVP and later expansion briefs describe multiple stages. Multiplayer remains inactive at the user's request. [REQUIREMENTS_AUDIT.md](REQUIREMENTS_AUDIT.md) records each delivered system, its actual limits and outstanding work.

## Delivered: stability and mobile controls

- Purchases charge once, clear held input and persist locally. Old saves recover from new building geometry without discarding campaign progress.
- Animated character cameras frame head to shoes, with loading/error fallback. Appearance controls and Save remain usable in portrait and landscape.
- Tap-to-walk uses bounded A* and checked segments around buildings, parked vehicles, current traffic and people. Manual input cancels a route; stalled routes replan.
- Contextual floating joystick, independent touch orbit/pinch, recenter, camera sensitivity and mission direction/distance.

## Delivered: Living Lagos simulation foundation

- 76 parcels across five zone categories, twelve named housing tiers, registration/disputes and adjacent deed linking.
- Persistent grid structures, rotations, preview, undo, demolition refunds and escape-path validation; modular interior entry for built shops/warehouses.
- Budgeted NPC customer sales, seven business models, product stock/prices, advertising, staff wages/quitting, generator power and insurance. Legacy businesses migrate without duplicate daily revenue.
- Crops, pests/water/soil/seasons, spoilage/cold storage, processing/quality-based sales, poultry and cattle management.
- 32 varied nearby citizens with routines, local avoidance, employment/tenancy links, theft events and capacity-checked transport boarding/exits. Patrol and guard routes respect property obstacles.
- Ten vehicle categories, parked/moving vehicle interactions, theft/robbery risk, saved ownership, fleet fare events and safer parking/exits.
- Basic solo combat, arcade chase, jail/bail/free hearing and fictional EFCC audit stages. Safe areas remain protected.
- Multi-step side missions, career shifts/promotions, education credentials, relationship/family milestones, bank interest/investments/ajo and hidden home storage.
- Calendar-based weather, flood/drought/harmattan effects, rain driving penalty, blackouts, fuel scarcity, inflation and procedural effects audio.
- Functional catalogue effects and compact phone apps; live-player chat explicitly Coming soon.

## Next production milestones

1. Author distinct housing floorplans with functional doors/stairs and walkable storeys; enlarge/merge construction grids with structural validation.
2. Add traffic turning/intersections/signals, route dispatch, individual garage vehicles, licenses/rental/refurbishment workflows and authored entry animations.
3. Extend persistent NPC memory/needs, business service queues, supply logistics, advanced crop/livestock processing and competing shop simulations.
4. Add physical combat/cover, hostile NPC responses, detailed crime evidence, 3D pursuit and faction systems.
5. Replace career/course/relationship counters with authored playable interviews, exams, repair/service challenges and household events; expand narrative endings.
6. Profile representative physical Android devices and long sessions; build asset compression/streaming, richer Nigerian models/materials and performance budgets from measurements.
7. When requested, deploy an authoritative shared service for automatic multiplayer discovery, real-player chat and atomic shared purchases/trades. No join-code flow is needed in the eventual public experience.

## Validation

58 automated tests pass. TypeScript and production build pass. Browser checks cover portrait/landscape enterprise/phone/profile, character loading, real UI construction payment and IndexedDB restoration, cattle/farm tab isolation, inactive chat and console errors. Physical-device FPS, exhaustive long-session NPC/traffic behavior and cross-device multiplayer are not validated.
