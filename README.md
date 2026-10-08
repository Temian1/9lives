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
- Car, danfo bus, okada, and keke trips: board at a motor park, pay once, watch a moving driving/chase view, and arrive at the destination park. Saved trips resume without a second fare.
- Buy vehicle keys at Mainland Motors; tap a key in your backpack to drive using WASD / joystick and Shift. Exit from the driving banner.
- Moving traffic can kill a pedestrian and damage a driven vehicle. Respawn at your home/hospital checkpoint, lose one life and medical expenses, and keep skills and purchases. The ninth death ends the campaign.
- Male/female guest characters: name, skin tone, clothing, hair color, and short/afro/braided hairstyles. Optional email is saved with the local profile. No account is needed to play.
- Food, water, medkits, pistols, ammunition, armor, bodyguards, and mystery boxes. Bodyguards follow you; boxes draw from a defined loot pool including cash, equipment, a bike key, and life tokens capped at nine lives.
- Hospital treatment, checkpoints, and shifts. Police fines and a fictional EFCC investigation office.
- Animated loading screen and responsive character preview.

## Five-chapter story

1. **A Fresh Start**: meet Tunde in Yaba.
2. **The Midnight Delivery**: investigate, accept or decline, and choose a public handoff or a risky alley.
3. **The Price of Trust**: continue from the chapter screen or journal. Travel to Ikorodu, meet Nurse Sade, and recover the riverfront ledger.
4. **Survival Costs Money**: take the ledger to Ikeja. Report it to the EFCC or sell it for more cash and a wanted level.
5. **Nine Chances**: visit Island Logistics in Victoria Island. Your earlier choice determines the final contract and ending.

Payments are gated by stage. Five survival stats share one simulation engine. Simple building collision bounds the world. Low graphics disables shadows and caps resolution. Physical Android performance profiling, rigged GLB animations, and full NPC schedules remain future work.

## Controls and saves

WASD/arrows move, Shift runs/accelerates, E interacts, M opens the city map, I opens the backpack, H opens help, and Escape pauses/closes dialogs. Touch users have a joystick and action buttons. Layouts adapt to portrait and landscape.

Validated IndexedDB saves remain on this browser/device. Old v0.1 saves migrate to a guest profile. Manual save, minute autosave, and save-on-hide are supported. Simulation and trips pause in dialogs, paused state, and hidden tabs. No offline time penalty or cloud sync.

## Multiplayer and online accounts: coming soon, inactive

The UI marks real-player chat, teams, combat, robbery, gifting, and optional online accounts **Coming soon**. It makes no online-server requests or simulated-player claims. Pistols are purchasable equipment; player shooting belongs to the future shared-city mode.

A separately runnable Node/WebSocket backend is included, disabled by default:

```sh
npm run server
```

`GET /api/status` reports `coming-soon`; account routes and socket upgrades are rejected until explicitly enabled. `.env.example` documents settings. The server uses process environment variables; it does not automatically load `.env` files.

For future development, `MULTIPLAYER_ENABLED=true` activates only the backend, not the current client UI. It supports email-free guests, optional username/password accounts with optional email, scrypt hashes, expiring HttpOnly sessions, request limits, authenticated sockets, authoritative movement/purchases/combat, safe zones, guard protection, team invitations, gifts, low-health robbery, and life-token loot on a kill. Account/player data persists in `.data/`, excluded from Git.

HTTP: `POST /api/guest`, `/api/register`, `/api/login`, `/api/logout`. Authenticated WebSocket: `/ws`. Messages: `move`, `chat`, `buy`, `work`, `open-gift`, `invite`, `accept-team`, `gift`, `attack`, `rob`. World snapshots broadcast every 200 ms.

A future online launch needs client-server integration, WebSocket hosting, a production database, HTTPS/secure cookies, origin configuration, moderation, and deployment testing. This release keeps multiplayer and online authentication inactive as requested.
