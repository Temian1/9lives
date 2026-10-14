# Requirements audit — Naija Empire update (v0.5)

Reviewed against the original **9LIVES Hybrid 3D Survival RPG** blueprint, the **Complete Game Improvement and Expansion** brief, the economy/simulation critique, the modular Nigerian business/farming brief, and the **Naija Empire** brief (build and upgrade houses and cars, get attacked, better graphics/UI/cars/physics, longer story, more farms and animals, better avatars, buildings facing roads, more NPC logic, Nigerian sim-strategy feel, sound effects, and a list of missing logic). This is an implementation inventory, not a claim that a finished AAA game exists.

## New in v0.5 — Naija Empire

| Requested | What is playable now and where |
| --- | --- |
| Build & upgrade houses, and get attacked | **Empire → Defend.** Every owned property has a condition (0–100%) and nine defences, each with three levels where applicable: fence & razor wire, steel gate, burglar bars, CCTV, floodlights, siren alarm, Boerboel guard dogs, mai-guard gateman, and a solar inverter that keeps powered defences on during NEPA outages. Dogs and gatemen cost weekly upkeep and leave if it goes unpaid. Existing construction blocks (fences, gates, security posts, CCTV poles, lamps) and hired security staff also count towards defence. Repairs are priced per point of damage. |
| Raids | After a 3-day newcomer grace period, valuable or poorly defended properties can be targeted, mostly at night, by **burglars, Omo Onile land grabbers, car snatchers, a rival's thugs or armed robbers**. Risk depends on property value, heat, district crime, rival hostility, defence and local influence. With CCTV, vigilantes or high influence an informant warns you of the target and time. **Away from the property:** the raid resolves on its own (vault cash, furniture, shop stock and reputation, plot blocks, or a parked car can be lost; insured losses are 70% claimable; tenants leave unsafe homes). **Within 30 m or inside:** the raid goes live: raiders walk to your door and break in, armed raiders shoot at you, dogs, gatemen and bodyguards fight back, and you can shoot or punch them (self-defence does not raise your wanted level). Raid bar actions: call police (response time varies by district and influence), pay a settlement (Omo Onile and thugs only), fight, flee, or go to the property. |
| Upgrade cars | **Empire → Garage.** Engine tune, performance tyres, suspension, armour plating (3 levels each), GPS tracker (recovers a snatched car), window tint, and respray paint. Prices are 50% higher away from Mainland Motors unless you own a dealership. Upgrades change real handling stats and appear on the 3D model (armour plates, bull bar, hood scoop, gold rims, tint, paint, lowered ride height). |
| Game physics | New car model (`src/vehiclePhysics.ts`): engine power curve, rolling and air drag, braking, reverse, steering that tightens with speed and is capped by tyre grip (understeer, less grip in rain), body roll and pitch, wheel spin, and collisions that bounce the car back with damage scaled by speed and armour. Crashes cost vehicle condition and, at high speed, health, and shake the camera. Pedestrians hit by cars are knocked back and fall. Traffic lights at all six main intersections stop NPC traffic on red. |
| Graphics & UI | Rebuilt vehicles (`src/Vehicles.tsx`) with rounded clear-coat bodies, glass, chrome, plates, working head/tail lights, a player headlight beam at night, a yellow Danfo with black stripes, roof rack and conductor, a keke with canopy, plus SUV, sports car, luxury sedan, taxi, van, okada and bicycle variants. Visible defences on properties, damage (rubble, scorch, smoke), open animal pens and fish ponds. New Empire dashboard with overview, defend, garage, ranch, rivals and story tabs; a pulsing live-raid alert bar; the Empire button shows your current title. |
| Buildings face the road | District buildings now turn to face their nearest main road, with signs and paths on that side; collision footprints are unchanged. Every plot and house has a road-facing front door (`shared/roads.ts`), and construction keeps the corridor in front of that door clear. |
| Story mode | **Empire arc: chapters 06–10**, played alongside the original five chapters. Chapter 06 *Omo Onile*, 07 *Agbero Wahala*, 08 *Chief Balogun's Offer*, 09 *Election Season*, 10 *Odogwu of Lagos*. Each has a requirement, a place to go and three branching choices with consequences (raids, rival wars, a joint venture, district influence, heat, lives). There are three endings: community, tycoon and family. All chapters are listed in the Journal. |
| Strategy layer | Net worth across cash, bank, investments, vaults, property (scaled by condition), vehicles and livestock, minus debt. Six titles from *Street hustler* to *Odogwu*. District **influence** grows with your property, businesses and repelled raids, and with sponsored owambes. **Heat** rises with wanted level and dirty cash. Three AI **rivals** grow their wealth, become hostile as you grow, and send thugs; you can negotiate truces, hire investigative journalists to expose them, or make a hostile takeover that pays a daily dividend. Vigilante patrols can be hired for a week at a time. |
| New farms and animals | Crops: plantain, scotch bonnet (*ata rodo*), okra, groundnut (processed into oil), sorghum, Kaduna ginger (dried). Animals (**Empire → Ranch**): West African Dwarf goats, Balami rams, Large White pigs, catfish, tilapia, giant African land snails, New Zealand White rabbits and guinea fowl. They need new housing blocks (goat pen, piggery, fish pond, snailery, rabbit hutch), feed and vet care. Goats, pigs and rabbits breed up to housing capacity, snails need humidity, and unguarded farms suffer theft. Prices rise at Sallah and Christmas. |
| Avatar | Character creator adds agbada, kaftan, senator suit, Ankara print shirt and iro & buba, with a procedurally generated Ankara wax-print pattern. Also fila, gele and beret headwear, coral beads or a gold chain, and a print/trim colour. |
| NPC logic | Citizens now have hunger and go to hawkers or shops to eat. They flee gunfire and raids, side-step fast cars heading at them, and get knocked down when hit. Their mood (scared, hungry, cheerful, busy, relaxed) adds a Pidgin line to their greeting. |
| Nigerian sounds / SFX | Layered engine sound driven by RPM, with different tones for heavy vehicles and bikes; tyre squeal; crash and bump; gunfire and enemy fire; Danfo double horn; raid drums; siren alarm; dog barks; cash register; construction hammering; win and lose stings; a rooster at dawn; generator hum during blackouts; and market or motor-park crowd murmur. Optional **street voices** (conductors calling "Oshodi! Oshodi! Enter with your change o!", hawkers selling pure water and puff-puff) use the browser's speech engine. They can be switched off in Empire → Overview. |

Validation: `npm test` now runs 70 checks (12 new in `src/empire.test.ts`). They cover road-facing doors, fortification pricing and caps, raid grace period and defence-driven rarity, unattended and live raids, settlement and police intel, car theft versus GPS tracker, tuning, physics bounds, livestock housing, breeding, maturity and festivals, story gating, and save validation. `npm run build` passes. A headless Chrome run at 1280×800 and 390×844 showed no console errors. It confirmed the agbada and fila on the avatar, road-facing buildings, traffic lights, the Empire dashboard, a live armed-robbery raid (raiders downed by defences, gunfire damage to the player, police bounty paid) and goats in a pen beside a fish pond.

## Missing logic — complete list after v0.5

**Construction & housing**
- Multi-storey interiors you can walk through, stairs, structural support/collapse, procedural roofs, 32/64-cell grids, voxel terrain editing; linked plots still keep separate grids.
- Twelve authored floorplans; interior layout does not mirror the exterior block arrangement.
- Raid damage is a condition percentage plus item and stock loss, not per-block destruction; there is no fire spread or visible break-in animation at doors and windows.
- Defences are per property, not placeable/aimable objects (e.g. no CCTV field of view).

**Vehicles & physics**
- Kinematic car model, not rigid-body: no suspension per wheel, drifting/handbrake turns, crash deformation, rollovers or vehicle-to-vehicle momentum transfer.
- NPC traffic still runs on fixed north–south lane loops: no turning at junctions, overtaking, BRT routes, horizontal-road traffic, go-slow jams, police vehicle pursuits, or licence and roadworthiness checks.
- One garage slot per vehicle type rather than individually serialised cars; no fuel stations to drive to (refuelling is a menu action), and no authored door or entry animations.

**Combat & raids**
- No cover system, knife combat, projectile ballistics, ragdolls, or physical ammunition pickup.
- Raiders use straight-line steering with local avoidance rather than full pathfinding; only one raid can be scheduled at a time; police arrive as a timer, not as 3D officers.
- No gang territories, faction reputation trees or retaliation chains beyond rival hostility.
- No player-led raids on rivals (only exposé and takeover).

**NPC simulation**
- Nearby NPCs only (32 seeded citizens); no persistent overnight positions, family trees or long-term memory of the player.
- Needs cover hunger and fear only, not hygiene, sleep or money. NPC food purchases do not spend their budgets or count as revenue for your shops.
- No restaurant seating, queues, NPC speech library or lip sync; street voices depend on the voices installed on the device.

**Economy & strategy**
- Rivals are abstract balance sheets: they do not own visible buildings, compete on specific shops or buy land.
- No supply trucks or logistics, import delivery times, factory chains, government contracts or per-business ledgers; tax, inflation and fuel use simplified fictional values.
- Elections are a one-off story chapter, not a recurring political system; influence has no effect on prices or customer flow yet.

**Agriculture**
- Animals use herd counts with an average age, not individual identity. There are no slaughter or processing products (meat, leather, smoked fish), egg or milk products for the new species, or pond water quality.
- No farm mini-games or custom livestock animations (animals bob and wander inside their housing).

**Story & careers**
- 10 chapters total (5 core + 5 Empire arc). No cinematic cameras, voice acting, or fully dynamic endings for every branch; the core finale is unchanged.
- Careers, interviews, marriage and family are still counters, not authored events. No inheritance system beyond the family-trust ending.

**Graphics, audio & platform**
- Stylised low-poly art: no photorealistic Nigerian assets, cloth simulation, or a texture streaming/KTX2 pipeline. Attire overlays are rigid meshes that can clip during animation.
- Sounds are synthesised; there are no recorded Nigerian street ambience packs or licensed Afrobeats tracks.
- Multiplayer (shared land, player raids, chat) remains **coming soon**; there is no gamepad remapping, and the interface is not translated beyond NPC greetings.
- Physical Android performance, thermals and long sessions are still unmeasured.

---

# Previous audit — Living Lagos update

## Playable in this release

| Requested system | Actual behavior and entry point |
| --- | --- |
| Original survival RPG | React/Three.js world, five survival stats, nine lives, checkpoints, Life Echoes, three core skills and five branching story chapters. Start with ₦1,000,000; final death imposes the requested one-hour campaign break. |
| Mobile character creation | Animated GLB turntable with loading fallback, male/female models, clothing/skin/hair/accessory/body controls; compact independent scrolling in portrait and landscape. Email/account optional; online accounts inactive. |
| Expanded city | Six connected districts; extra Yaba tech tower, clinic/Yaba Left, Lands Bureau, school and Ade; river, three road bridges and forest scenery. Roads, buildings, businesses and district styles differ. |
| Buyable land and housing | 76 advertised parcels, including village/town/city/highway/industrial zones and twelve named housing tiers. Buy, build, enter, furnish, upgrade, sell, rent or let houses. Four residential holdings per district; industrial land exempt. |
| Deeds and disputes | Register newly bought deeds at Yaba Lands Bureau. Unregistered construction incurs periodic fictional Omo Onile disputes and possible partial demolition. Existing ownership is migrated without retroactive penalties. |
| Minecraft-inspired building | Saved grid construction: 18 priced materials/structures, snapping, quarter-turn rotation, three vertical placement layers, preview, collision/escape checks, undo and 40% demolition refunds. Select **Life & jobs → Land, farming & businesses** or an owned property's construction button. |
| Adjacent ownership | Link adjacent owned deeds and remove shared-side fences. Each deed retains its own grid. |
| Home storage | Enter an owned property to hide/retrieve money and movable inventory. Storage is separate per home. Selling returns stored belongings and removes sold construction/business state. |
| NPC population | 32 seeded varied citizens with work, school, shopping, social, sleep and commute routines; hired citizens get work destinations and tenants get home destinations. Nearby NPCs follow obstacle-checked routes with local separation. Pickpockets can take cash; guards/armor deter them. |
| Customer trading | Visitors reach business entrances, purchase in-stock catalogue items from individual budgets and generate receipt-protected payments. Opening hours, prices versus rival thresholds, ads, electricity and reputation affect sales. No daily synthetic revenue for migrated or new businesses. |
| Business types | Provisions, phones, vehicle dealership, club, church, farming and passenger transport. Product-specific buying/pricing/stock, staff roles, weekly wages and quitting after two unpaid cycles; generator fuel and insurance. |
| Crop farming | Eight Nigerian crop models, growth/germination timing, soil, watering, pests, crop rotation, seasonal harvest suitability, irrigation and greenhouses. Tomato spoilage after three game days unless powered cold storage. Warehouse processing for garri/red oil/cocoa beans; market/wholesale/export sales with quality gates. |
| Livestock | Broilers/layers/cockerels/turkeys; housing, feed, maturity, vaccination/disease, eggs and manure soil benefits. Three cattle breeds, feed/water/herders/vet care, milk, sale values and rustler losses. |
| Transport and NPC riders | Ten purchasable/drivable vehicle categories. NPC capacity checks, terminal stops, boarding and safe separated exits for buses/cars/bikes/keke. Player fares are charged once; cabin/exterior camera switching and saved inter-district rides remain available. Assigned fleet trips pay fares minus fuel after NPC trips. |
| Vehicle theft/robbery | Approach and tap traffic or parked vehicles. Interaction pauses traffic; robbery grants separately tagged dirty cash. Theft can transfer a key and parked vehicle or trigger an alarm/chase. Witness count, security and skill affect chance. Vehicle exits have collision checks and a brief traffic grace period. |
| Crime consequences | Wanted patrol pursuit, NPC pistol/melee hits and traffic injuries, protected zones, witness-based theft risk, fictional staged EFCC audit/account freeze/raid, lawyer, bail and free hearing. Three-lane arcade escape supports hazards, pickups, shields, multipliers and bounded rewards. |
| Careers and social life | Existing delivery/taxi/repair/shop jobs, employment/interview/shift/promotion counters, education credentials, daily relationship actions, marriage/family milestones and assistance. Ade/clinic/witness/community missions now require three location-based steps. |
| Economy and weather | Rent/arrears/landlord negotiation/eviction, bank/loan/interest/bills, investment risk, ajo savings, insurance claims and fictional business tax. Lagos-calendar seeded rainy/dry seasons, storms, flood losses, drought, harmattan, blackouts, fuel scarcity and price inflation. Rain affects driving speed. |
| Inventory, sounds and phone | 36 additional catalogue items with food/drink, clothes, furniture, decoration, entertainment, exercise and farm effects. Procedural footsteps, engine, horn, shot, rain/thunder effects. Phone apps show bank/jobs/map/business/weather/landlord notifications. Two licensed real recordings plus permitted imported songs. |
| Persistence and modularity | Validated IndexedDB saves, old ownership/business migration, save-on-hide, offline shell/visited asset caching; JSON business/crop/animal/building/item catalogues. Simulation does not penalize offline elapsed time. |

## Partial systems and remaining requests

| Area | Exact current limit / remaining work |
| --- | --- |
| Multiplayer / real-player phone chat | **Coming soon**, following the user's explicit decision to defer hosting. No cross-phone presence, live chat, shared land, player-to-player theft/life transfer or gifts are active. Prepared backend tests do not establish a public service. |
| Graphics and assets | Bundled stylized licensed GLBs; no photorealistic Nigerian art pack, high-detail clothing deformation or AAA rendering. Physical Android 30-FPS and long-session texture/thermal tests remain unverified. No KTX2/Draco terrain-streaming pipeline yet. |
| Construction | Three placement layers are saved geometry, not walkable multi-floor physics. No 32/64 grids, structural support, stairs, procedural roofs or arbitrary voxel terrain. Linked plots keep separate grids rather than becoming one enlarged grid. Not every grass polygon can be purchased. |
| Housing and interiors | Twelve tier names/prices/sizes and editable furniture/dividers; no twelve fully authored architectural floorplans, selectable storey navigation or detailed landlord/tenant negotiations inside rooms. Built grid shops/warehouses enter a modular shop scene; interior is not the exact exterior block arrangement. |
| NPC simulation | Nearby simulation is culled for performance. No persistent overnight population positions, individual long-term memory/needs/family trees, restaurant seating/service queues or full hierarchical group navigation. Named story NPCs remain fixed contacts. Staff roles and tenancy links are lightweight schedules; huge staffing populations are represented by counts. |
| Traffic and driving | Kinematic footprint/swept collisions and braking, not rigid-body suspension or crash deformation. Traffic follows vertical lane loops; no turning intersections, traffic lights, overtaking, BRT-specific routes or driver-license checks. Passenger cabin and boarding are simplified; no authored door/entry animations. One garage entry per vehicle category, not unlimited individually serialized cars. |
| Fleet/dealership/phones | NPC-trip fare income and product catalogues exist. Dedicated route-dispatch UI, rental contracts, vehicle sourcing/refurbishment, papers/seizures and phone repair/NIN workflows remain absent. |
| Agriculture | Growth parameters are simplified game balancing. No separate farm minigames, autonomous breeding, beef/leather processing, custom livestock animations, per-animal identity or full logistics/export paperwork. Pest effects are generic health damage. Annual festival price multiplier is simplified. |
| Business economy | Rival competition uses price thresholds, not fully simulated competing shops. No supply-truck logistics, delivered imports, customer negotiation, factory production chain, government procurement or per-business audited accounts. Insurance is a one-time game purchase; tax/fuel/inflation use fictional simplified values. |
| Crime / combat | NPC incapacitation and next-day hospital recovery rather than NPC life stealing. No hostile NPC gunfire, physical projectiles, cover, knife combat, forensic evidence trail, police vehicle pursuit, gang territories or faction reputation trees. Arcade chase is a UI minigame, not a streamed 3D chase scene. Dirty-cash conversion/audits are fictional counters, not a financial realism model. |
| Careers / education / relationships | Courses grant credentials; no exams or school timetables for the player. Repair/shop tasks remain ordered buttons. Interviews, promotions, marriage and family are counters rather than full authored life events/mini-games. No legal career progression, perk trees, inheritance or family NPC household simulation. |
| Narrative | Five existing chapters and four multi-step side missions; no 30+ chapters, cinematic camera choreography, voice performances or fully dynamic every-chapter endings. Existing finale primarily follows evidence decisions. |
| Calendar and language | Calendar initializes from Lagos date then advances by game days; weather is seeded, with no external weather API. Greeting presets cover English/Pidgin/Yoruba/Igbo/Hausa; the full interface is not translated. |
| Durability / accessibility / audio | Catalogue durability metadata classifies consumables/reusable purchases; no wear/repair simulation for every item. No NPC speech library or complete gamepad remapping. Real recordings are Kevin MacLeod tracks, not unlicensed commercial artist songs. |

## Validation evidence

- `npm test`: 58 passing checks covering survival/story, purchases, future backend rules, geometry/navigation, rent/resale, customer budgets/receipts, crop spoilage/processing, livestock/wages, vault conservation, both theft outcomes, NPC capacity/exits, fleet payouts, audit/hearing, chase rewards, malformed saves and legacy migrations.
- `npm run build`: TypeScript and Vite production build pass. Vite reports the expected large Three.js vendor chunk; this is not a measured device performance result.
- Browser: 390×844 portrait and 844×390 landscape; enterprise/phone/profile fit without horizontal overflow; animated character loads; actual UI wall purchase deducted ₦500 once and survived IndexedDB save/load; cattle-to-farm switching stayed functional; chat truthfully disables Send; no console errors in the checked flows.
- These checks do not prove all NPC traffic routes are glitch-free over long sessions, physical-device performance, or shared multiplayer behavior.

Crop/animal game timing was cross-checked with [IITA cassava harvesting guidance](https://data.iita.org/dataset/standard-operating-procedure-sop-for-harvesting-and-harvest-evaluation-in-cassava), [FAO small-scale poultry guidance](https://www.fao.org/4/y4628e/y4628e03.htm), and [FAO poultry production guidance](https://www.fao.org/4/y1187e/y1187e15.htm). Actual maturity varies by breed/cultivar and conditions; the catalogue values are simplified game parameters.
