# 9LIVES — Expanded Lagos

A browser survival RPG built with React 19, TypeScript, Vite, Three.js, React Three Fiber, and Zustand. Bundled licensed GLB models upgrade the stylized world, furniture and animated characters. Portrait, landscape, keyboard, and touch controls are supported.

## Run

```sh
npm install
npm run dev
```

Open the URL Vite prints. Phones on the same Wi-Fi can use the LAN URL. `npm run build` creates `dist/`; `npm run preview` serves the production game. `npm test` checks campaign, purchases, transport, collisions, account endpoints, and future multiplayer rules.

## Playable now

- Six connected fictionalized districts: Yaba, Ikorodu, Ikeja, Victoria Island, Mainland, and Lekki. Walk between them or use roads and motor parks. Detailed nearby districts load as you explore.
- Ten vehicle categories: car, danfo bus, okada, keke, bicycle, SUV, sports car, luxury sedan, taxi and delivery van. Trips: board at a motor park, pay once, watch from a modeled rear passenger cabin in cars/buses (switch to an exterior camera), and arrive at the destination park. Saved trips resume without a second fare.
- Buy vehicle keys at Mainland Motors; tap a key in your backpack to drive using WASD / joystick and Shift. Exit from the driving banner.
- Moving traffic can kill a pedestrian and damage a driven vehicle. Respawn at your home/hospital checkpoint, lose one life and medical expenses, and keep skills and purchases. The ninth death starts a persistent one-hour break before a fresh campaign can begin.
- Male/female guest characters: name, skin tone, clothing, hair color, and short/afro/braided hairstyles. Optional email is saved with the local profile. No account is needed to play.
- Food, water, medkits, pistols, ammunition, armor, bodyguards, and mystery boxes. Bodyguards follow you; boxes draw from a defined loot pool including cash, equipment, a bike key, and life tokens capped at nine lives.
- Hospital treatment, checkpoints, and shifts. Police fines and a fictional EFCC investigation office.
- Distinct district skylines: Yaba apartments, Ikorodu red-roof courtyards and produce stalls, Ikeja commercial blocks and phone stalls, VI towers, Mainland workshops, and Lekki villas. More houses/businesses use the same geometry as collision detection.
- Buy houses and district land plots; build a house, club, church or shop, and upgrade three levels. Use Properties to browse prices, then walk to a home entrance to enter.
- Furnished cutaway home interiors: walk around, tap furniture or use Sit, Sleep and Watch TV. Buy a sofa, bed, TV, kitchen, table and plant; purchases and interior state persist locally.
- Rotating/pinching touch camera, mouse right-drag and wheel zoom, transparent mobile stats collapsed by default.
- Hawkers sell supplies, motor parks have boarding rings, Mainland Motors displays vehicles, and roadside billboards advertise the districts. The Music button plays licensed recordings after a user gesture. Life & jobs → Music & club playlist lets you choose tracks or import your permitted MP3/OGG/WAV files.
- Police/EFCC patrols pursue wanted players. Capture opens jail, bail and a free legal hearing; it does not consume a life. Selling the evidence creates a wanted level.
- Animated loading screen and responsive character preview.

## Five-chapter story

1. **A Fresh Start**: meet Tunde in Yaba.
2. **The Midnight Delivery**: investigate, accept or decline, and choose a public handoff or a risky alley.
3. **The Price of Trust**: continue from the chapter screen or journal. Travel to Ikorodu, meet Nurse Sade, and recover the riverfront ledger. Following a stranger at the depot triggers a kidnapping: pay ₦3,000 or call Sade for a police rescue (trust −20). The three-minute active-play deadline costs a life if unanswered.
4. **Survival Costs Money**: take the ledger to Ikeja. Report it to the EFCC or sell it for more cash and a wanted level.
5. **Nine Chances**: visit Island Logistics in Victoria Island. Your earlier choice determines the final contract and ending.

Payments are gated by stage. Five survival stats share one simulation engine. Rotated vehicle footprints, swept movement and shared building/stall bounds prevent clipping. Equal lane speeds and separation checks keep traffic from overtaking through cars; traffic yields to the player vehicle. Low graphics disables shadows and caps resolution. Animated GLB characters and 32 varied citizens follow nearby work, shopping, school, social, sleep and commute routines. Physical Android performance profiling remains unverified.

## Controls and saves

WASD/arrows move, Shift runs/accelerates, E interacts, M opens the city map, I opens the backpack, H opens help, and Escape pauses/closes dialogs. Touch users can tap an open floor or street to walk along a collision-aware route. Hold or drag the lower-left gameplay area to reveal a floating movement joystick; release hides it. Drag the right side to look around, pinch with two camera fingers to zoom, and use the recenter button to reset the view. Movement and camera fingers stay separate. The same joystick steers owned vehicles. Mission directions show a distance and can be tapped to walk toward an entrance. Layouts adapt to portrait and landscape.

Validated IndexedDB saves remain on this browser/device. Old v0.1 saves migrate to a guest profile. Manual save, minute autosave, and save-on-hide are supported. Simulation and trips pause in dialogs, paused state, and hidden tabs. The kidnapping timer continues through its ransom dialog but pauses with the game or hidden tab. The one-hour campaign break uses wall-clock time, including time offline. No offline time penalty or cloud sync.

## New life simulation

New campaigns start with ₦1,000,000. Older saves receive a one-time starter-fund migration marked in saved flags. **Life & jobs** opens playable delivery/taxi jobs (pickup and destination), repair/shop task sequences, banks/loans/bills, health/hygiene/storage, property management, vehicle care, music and a Coming soon multiplayer panel.

Available homes can be rented with the first week's rent and two weeks' deposit. Weekly arrears generate notices and landlord messages; negotiate once per day, pay arrears or end your lease. Three unpaid cycles cause eviction. Owned houses can be let to tenants for weekly income. Sell any owned property for 70% of catalog value including furniture/improvements; sale removes access and business records.

Enter any owned building or rented home at its entrance. Homes support cooking, bathing, cleaning, exercise and storage alongside sitting/sleeping/TV. Clubs, churches and shops have themed fixtures and can be furnished. Position furniture and construct/move/rotate room dividers in the editor. Businesses now use product stock/prices and actual NPC visits: each customer spends a budget and consumes stock once. Hours, rival price thresholds, advertising, reputation, power and weekly wages affect operation. Existing businesses migrate to this model.

Hospitals sell one **in-game life** for ₦25,000, maximum nine. No real-money purchase occurs and zero lives cannot bypass the one-hour break. Fuel, condition and parking coordinates persist for owned vehicles; find them in Vehicle care. Vehicles accelerate and decelerate, with Space braking on keyboard and joystick-release deceleration on touch. Day/night lighting follows the player; seeded Lagos-calendar seasons bring rain/storms/floods, dry-season drought/harmattan, blackouts and fuel scarcity.

## Living Lagos expansion

Open **Life & jobs → Land, farming & businesses**, or use the construction/business button on an owned property. There are 76 parcels, twelve named housing tiers, deed registration, a saved grid builder with undo/refunds, crop farming, poultry/cattle, staff wages, generator fuel, insurance, fleet income, careers, education and multi-step side missions. Owned home vaults store money/items; resale returns these belongings and removes the sold business.

Approach and tap a parked or moving vehicle to attempt robbery/theft. Interactions pause traffic, exits get a brief grace period, and alarms can start the three-lane escape minigame. Police, jail/hearings and fictional EFCC audit stages provide consequences. Fists and pistol shots can incapacitate NPCs outside protected zones; injured NPCs recover the next game day.

The Phone button opens apps for weather, contacts, jobs, banking, business and landlord notices. Real-player chat clearly stays Coming soon. Read [REQUIREMENTS_AUDIT.md](REQUIREMENTS_AUDIT.md) for the complete comparison against every pasted brief, including partial implementations and outstanding requests.

## Multiplayer — Coming soon

Multiplayer is inactive for this release, as requested. Opening the website on another phone does not create a shared session. The UI shows Coming soon and has no invitation-code flow. Existing experimental peer code and backend rules remain in the repository, but the game does not start a shared connection service. A future hosted connection service can support automatic discovery without join codes.

## Optional online backend — disabled / coming soon

`npm run server` starts the separately included Node/WebSocket backend. By default, /api/status reports coming-soon and account/socket routes are inactive. .env.example describes the explicit enable flag. Optional email-free guests and username/password accounts remain prepared for a later hosted launch. Public-server deployment still needs client integration, persistent shared data, HTTPS/cookies, origin configuration, moderation and anti-cheat.

## Music and model credits

**Beauty Flow** and **Carefree** are real recordings by Kevin MacLeod ([incompetech](https://incompetech.com/music/royalty-free/)), used unmodified under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Exact track sources and attribution are in public/assets/licenses/music.txt and the music player. Audio is loaded only when played. Up to twenty permitted recordings can be imported into device storage; format support depends on the browser. Commercial artist tracks require permission and are not bundled.

Bundled Kenney models: [Blocky Characters](https://kenney.nl/assets/blocky-characters), [City Kit Commercial](https://kenney.nl/assets/city-kit-commercial), [City Kit Suburban](https://kenney.nl/assets/city-kit-suburban), [Furniture Kit](https://kenney.nl/assets/furniture-kit). CC0 license files are in public/assets/licenses/. Texture references were relocated to local bundled texture folders. No runtime asset CDN is needed.

Add licensed GLBs to public/assets/models/ and use Asset or RiggedPerson to expand the art. Fit model dimensions to shared collider bounds and keep source/license records. The character studio offers eight models, appearance colors, hairstyles, accessories and height/build controls. Graphics are stylized rather than photorealistic.

## Offline and remaining limits

The production service worker caches the shell and successfully visited code/models. Visit the game and districts online first; unvisited assets are not predownloaded. Recorded music is excluded from offline caching. Imported songs remain on their original device. The manifest permits either orientation; development does not register the service worker.

This is a playable prototype. Advanced suspension, turning traffic intersections, walkable multiple floors, authored housing layouts, terrain streaming, forensic crime evidence, hostile NPC gunfire/cover, full career/education minigames and shared construction remain future work. The requirements audit describes precise limits; passing automated tests does not establish glitch-free long sessions or physical Android performance. Repair/shop jobs are ordered task menus rather than physics simulations. Delivery/taxi jobs use pickup/destination checks. Automated tests cover campaign/survival/collisions/purchases/room rules plus landlord eviction, resale, banking, jobs and malformed nested saves. Browser checks cover desktop/mobile layouts, property purchase/entry, saved deeds, character previews, asset loading, touch controls and tap-to-move.
