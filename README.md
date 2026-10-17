# Urdu Doodles ✏️

Three keyboard-mash games that teach Urdu words, drawn as wobbly cartoon doodles.
Every key (and every mouse click) does something, and a voice says the word in Urdu.

| Game | What happens on each key press | What he hears |
|---|---|---|
| **جانور Jaanwar** (animals) | A doodle animal pops up on the meadow — left-side keys make it appear on the left | *billi! … miyaun miyaun* |
| **غبارے Ghubaare** (balloons) | A smiling balloon floats up; extra mashing pops balloons into confetti | *laal ghubaara!* |
| **گنتی Ginti** (counting) | One more apple on the tree, star in the sky or fish in the pond, counted out loud up to ten, then a party | *ek, do, teen … das seb — shaabaash!* |

When he mashes faster than the voice can talk, the extra presses make things hop, wiggle or pop instead, so each new picture always gets its own word.

---

## Build it (one time, ~2 minutes)

1. Unzip this folder somewhere, e.g. your Documents.
2. Open **Terminal**, type `cd ` (with a space), drag the folder into the Terminal window, press Return.
3. Run:
   ```
   ./build.sh
   ```
   - If macOS asks to install the **Command Line Tools**, click Install, wait, then run `./build.sh` again.
   - The script downloads a free neural Urdu voice once (Microsoft's *Uzma*) and records all the words. No internet? It falls back to the Mac's own voices.
4. A Finder window opens with **Urdu Doodles.app**. Drag it into **Applications** (do this before step 5).

## First launch: let it lock the keyboard

The first time you open it, it asks for **Accessibility** permission — that's what lets it swallow ⌘Tab, ⌘Space, ⌘Q, Mission Control, volume keys and so on.

Click **Open Settings**, switch on **Urdu Doodles** under *Privacy & Security → Accessibility*, go back and click **Start Playing**. The menu screen shows a green dot when the keyboard is fully locked.

## Playing

- Pick a game with the mouse on the menu screen, then hand over the keyboard.
- **Quit:** hold **⌃ control + ⌥ option + ⌘ command** and type **B**, **Y**, **E**.
- **Back to the menu:** hold the same three keys and press **M**.
- The screen won't go to sleep while the game is open.

What it can't block: the power / Touch ID button and closing the laptop lid. If a trackpad swipe still switches spaces on your Mac, turn off trackpad gestures in System Settings → Trackpad while he plays.

## Use your own voice (recommended!)

Toddlers respond best to a parent's voice. Record any word (Voice Memos is fine), name the file after the word's id, and drop it in the `my-voice` folder, e.g. `my-voice/a_cat.m4a` for *billi*. Then run `./build.sh` again. All the ids and words are listed in `game/words.js`.

Other voice options:
```
URDU_VOICE=ur-PK-AsadNeural ./build.sh --force    # male neural voice
URDU_RATE=-25% ./build.sh --force                 # speak slower
```

## Changing things

- **Words / spellings:** `game/words.js` (then `./build.sh --force` to re-record).
- **Art:** `game/doodles.js` — plain SVG shapes; the engine adds the hand-drawn wobble.
- **Preview without locking:** open `game/index.html` in Safari or Chrome (press Esc twice for the menu).

After rebuilding the app, macOS may silently stop trusting it: if the menu shows an orange dot, open Accessibility settings, remove Urdu Doodles with the – button, and open the app again.
