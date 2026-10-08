# 9LIVES — Expanded Lagos

A browser survival RPG built with React 19, TypeScript, Vite, Three.js, React Three Fiber, and Zustand. Procedural low-poly art avoids external model downloads. Portrait, landscape, keyboard, and touch controls are supported.

## Run

```sh
npm install
npm run dev
```

Open the URL Vite prints. Phones on the same Wi-Fi can use the LAN URL. `npm run build` creates `dist/`; `npm run preview` serves the production game. `npm test` checks campaign, purchases, transport, collisions, account endpoints, and future multiplayer rules.

## Playable now

- Six connected fictionalized districts: Yaba, Ikorodu, Ikeja, Victoria Island, Mainland, and Lekki. Walk between them or use roads and motor parks. Detailed nearby districts load as you explore.
- Car, danfo bus, okada, and keke trips: board at a motor park, pay once, watch from a modeled rear passenger cabin in cars/buses (switch to an exterior camera), and arrive at the destination park. Saved trips resume without a second fare.
- Buy vehicle keys at Mainland Motors; tap a key in your backpack to drive using WASD / joystick and Shift. Exit from the driving banner.
- Moving traffic can kill a pedestrian and damage a driven vehicle. Respawn at your home/hospital checkpoint, lose one life and medical expenses, and keep skills and purchases. The ninth death starts a persistent one-hour break before a fresh campaign can begin.
- Male/female guest characters: name, skin tone, clothing, hair color, and short/afro/braided hairstyles. Optional email is saved with the local profile. No account is needed to play.
- Food, water, medkits, pistols, ammunition, armor, bodyguards, and mystery boxes. Bodyguards follow you; boxes draw from a defined loot pool including cash, equipment, a bike key, and life tokens capped at nine lives.
- Hospital treatment, checkpoints, and shifts. Police fines and a fictional EFCC investigation office.
- Distinct district skylines: Yaba apartments, Ikorodu red-roof courtyards and produce stalls, Ikeja commercial blocks and phone stalls, VI towers, Mainland workshops, and Lekki villas. More houses/businesses use the same geometry as collision detection.
- Buy houses and district land plots; build a house, club, church or shop, and upgrade three levels. Use Properties to browse prices, then walk to a home entrance to enter.
- Furnished cutaway home interiors: walk around, tap furniture or use Sit, Sleep and Watch TV. Buy a sofa, bed, TV, kitchen, table and plant; purchases and interior state persist locally.
- Rotating/pinching touch camera, mouse right-drag and wheel zoom, transparent mobile stats collapsed by default.
- Hawkers sell supplies, motor parks have boarding rings, Mainland Motors displays vehicles, and roadside billboards advertise the districts. The Radio button plays an original synthesized instrumental loop after a user gesture.
- Police/EFCC patrols pursue wanted players. Capture deducts the fine, advances two hours and returns you to the police station. Selling the evidence creates a wanted level.
- Animated loading screen and responsive character preview.

## Five-chapter story

1. **A Fresh Start**: meet Tunde in Yaba.
2. **The Midnight Delivery**: investigate, accept or decline, and choose a public handoff or a risky alley.
3. **The Price of Trust**: continue from the chapter screen or journal. Travel to Ikorodu, meet Nurse Sade, and recover the riverfront ledger. Following a stranger at the depot triggers a kidnapping: pay ₦3,000 or call Sade for a police rescue (trust −20). The three-minute active-play deadline costs a life if unanswered.
4. **Survival Costs Money**: take the ledger to Ikeja. Report it to the EFCC or sell it for more cash and a wanted level.
5. **Nine Chances**: visit Island Logistics in Victoria Island. Your earlier choice determines the final contract and ending.

Payments are gated by stage. Five survival stats share one simulation engine. Rotated vehicle footprints, swept movement and shared building/stall bounds prevent clipping. Equal lane speeds and separation checks keep traffic from overtaking through cars; traffic yields to the player vehicle. Low graphics disables shadows and caps resolution. Physical Android performance profiling, rigged GLB animations, and full NPC schedules remain future work.

## Controls and saves

WASD/arrows move, Shift runs/accelerates, E interacts, M opens the city map, I opens the backpack, H opens help, and Escape pauses/closes dialogs. Touch users have a joystick and action buttons. Layouts adapt to portrait and landscape.

Validated IndexedDB saves remain on this browser/device. Old v0.1 saves migrate to a guest profile. Manual save, minute autosave, and save-on-hide are supported. Simulation and trips pause in dialogs, paused state, and hidden tabs. The kidnapping timer continues through its ransom dialog but pauses with the game or hidden tab. The one-hour campaign break uses wall-clock time, including time offline. No offline time penalty or cloud sync.

## Multiplayer and online accounts: coming soon, inactive

The UI marks real-player chat, teams, combat, robbery, gifting, and optional online accounts **Coming soon**. It makes no online-server requests or simulated-player claims. Pistols are purchasable equipment; player shooting belongs to the future shared-city mode.

A separately runnable Node/WebSocket backend is included, disabled by default:

```sh
npm run server
```

`GET /api/status` reports `coming-soon`; account routes and socket upgrades are rejected until explicitly enabled. `.env.example` documents settings. The server uses process environment variables; it does not automatically load `.env` files.

For future development, `MULTIPLAYER_ENABLED=true` activates only the backend, not the current client UI. It supports email-free guests, optional username/password accounts with optional email, scrypt hashes, expiring HttpOnly sessions, request limits, authenticated sockets, authoritative movement/purchases/combat, safe zones, guard protection, team invitations, gifts, low-health robbery, and life transfers on a lethal attack (attacker capped at nine), and a server-enforced one-hour exhaustion break. The `restart` message only succeeds after that deadline. Account/player data persists in `.data/`, excluded from Git.

HTTP: `POST /api/guest`, `/api/register`, `/api/login`, `/api/logout`. Authenticated WebSocket: `/ws`. Messages: `move`, `chat`, `buy`, `work`, `open-gift`, `invite`, `accept-team`, `gift`, `attack`, `rob`, `restart`. World snapshots broadcast every 200 ms.

A future online launch needs client-server integration, WebSocket hosting, a production database, HTTPS/secure cookies, origin configuration, moderation, and deployment testing. This release keeps multiplayer and online authentication inactive as requested.
