# Urdu Doodles ✏️

Four keyboard-mash games that teach Urdu words, drawn as wobbly cartoon doodles.
Every key (and every mouse click) does something, and a voice says the word in Urdu.

| Game | What happens on each key press | What he hears |
|---|---|---|
| **جانور Jaanwar** (animals) | A doodle animal pops up on the meadow — left-side keys make it appear on the left | *billi! … miyaun miyaun* |
| **غبارے Ghubaare** (balloons) | A smiling balloon floats up; extra mashing pops balloons into confetti | *laal ghubaara!* |
| **کھانا Khaana** (food) | A hungry bear gets a Pakistani food on his plate — roti, naan, biryani, anday, dahi, jalebi, chai… — and gobbles it up; after eight bites his tummy is full | *biryaani! … hap! … pait bhar gaya!* |
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
   - It records all the words with the best voice engine you have a key for (see **Voices** below); with no keys it uses a free Microsoft voice.
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

## Voices

`./build.sh` records every word with the best voice engine you have a key for:

| Engine | Why | Key |
|---|---|---|
| **ElevenLabs Eleven v4** | The most expressive; lists Urdu as supported. Gets "excited/playful" direction and a "talking to my baby" context. | `ELEVENLABS_API_KEY` |
| **Uplift AI Orator** | Made in Pakistan specifically for natural Urdu. | `UPLIFT_API_KEY` |
| **Gemini TTS** | Takes a style prompt plus a pronunciation hint; Urdu isn't officially listed. | `GEMINI_API_KEY` |
| Microsoft (free) | No key needed, but flat. | — |

1. `cp .env.example .env` and paste in one or more keys (`.env` is git-ignored).
2. `./build.sh --audition` records 5 sample words with every engine you have keys for and opens a page to compare them.
3. Put the winner in `.env` (`URDU_TTS=elevenlabs`, say) and run `./build.sh`. Clips from a different engine are re-recorded automatically.

**Mispronounced word?** Each word in `game/words.js` has a `say` field, the Urdu with vowel marks (zabar / zer / pesh) that the voice model actually reads. Adjust it, then re-record just that clip: `./build.sh --only a_cat`.

**ElevenLabs voice:** the default is a stock voice. For a native accent, open the ElevenLabs Voice Library, filter Language → Urdu, add a voice you like to My Voices, and put its ID in `.env` as `ELEVENLABS_VOICE_ID`.

### Your own voice (still the best option for a 1-year-old)

Double-click **`word_recorder/Record Words.command`** (or run `python3 word_recorder/recorder.py`). It opens a page in your browser that walks through every word in the game:

- press **space** to start, **space** again to stop: it trims the silence, evens out the volume, saves the clip and plays it back
- press **space** again to redo, **→** for the next word; a tick shows which words are done
- recordings are saved to `my-voice/<word-id>.wav`

When you're done, close the Terminal window and run `./build.sh`. Your recordings always win over any computer voice, so you can record just the words you care about and leave the rest to a voice engine.

## Changing things

- **Words / spellings:** `game/words.js` (then `./build.sh --force` to re-record).
- **Art:** `game/doodles.js` — plain SVG shapes; the engine adds the hand-drawn wobble.
- **Preview without locking:** open `game/index.html` in Safari or Chrome (press Esc twice for the menu).

After rebuilding the app, macOS may silently stop trusting it: if the menu shows an orange dot, open Accessibility settings, remove Urdu Doodles with the – button, and open the app again.
