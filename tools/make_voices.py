#!/usr/bin/env python3
"""Make the spoken Urdu clips for Urdu Doodles.

For every clip in game/words.js it uses, in order of preference:
  1. your own recording in my-voice/<clip-id>.(m4a|mp3|wav|aiff)   ← record yourself!
  2. a clip already made on an earlier run (use --force to remake them)
  3. Microsoft's free neural Urdu voice via the `edge-tts` package (needs internet once)
  4. the Mac's built-in `say` voices: an Urdu voice if one is installed, otherwise
     the Hindi voice reading the same words (they sound the same for these words)
Anything still missing is spoken live by the Mac's speech voice while playing.

Environment knobs:
  URDU_VOICE=ur-PK-AsadNeural   (male)   default: ur-PK-UzmaNeural (female)
  URDU_RATE=-20%                slower / faster speech, default -12%
"""
import asyncio
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GAME = ROOT / "game"
OUT = GAME / "voice"
CUSTOM = ROOT / "my-voice"
VOICE = os.environ.get("URDU_VOICE", "ur-PK-UzmaNeural")
RATE = os.environ.get("URDU_RATE", "-12%")
PITCH = os.environ.get("URDU_PITCH", "+6Hz")
FORCE = "--force" in sys.argv
AUDIO_EXT = (".m4a", ".mp3", ".wav", ".aiff", ".aif", ".caf")


def load_words():
    text = (GAME / "words.js").read_text(encoding="utf-8")
    start = text.index("{", text.index("window.WORDS"))
    end = text.rindex("}") + 1
    return json.loads(text[start:end])


def existing(folder, cid):
    for ext in AUDIO_EXT:
        p = folder / f"{cid}{ext}"
        if p.exists() and p.stat().st_size > 500:
            return p
    return None


async def edge_batch(items):
    """items: list of (id, text). Returns {id: path} for the clips that worked."""
    try:
        import edge_tts  # noqa: F401
    except Exception:
        print("  · neural voice not available (edge-tts not installed)")
        return {}
    import edge_tts
    made = {}
    for i, (cid, text) in enumerate(items, 1):
        out = OUT / f"{cid}.mp3"
        last_err = None
        for attempt in range(3):
            try:
                await edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH).save(str(out))
                if out.exists() and out.stat().st_size > 500:
                    made[cid] = out
                    break
            except Exception as e:  # network hiccups, throttling
                last_err = e
                await asyncio.sleep(1.5 * (attempt + 1))
        status = "ok" if cid in made else f"failed ({last_err})"
        print(f"  · [{i}/{len(items)}] {cid:12s} {text}  {status}")
        if not made and i >= 2:
            print("  · neural voice isn't reachable right now; falling back to the Mac's voices")
            break
    return made


def mac_voice():
    """Pick an Urdu voice if the Mac has one, else Hindi. Returns (name, 'ur'|'hi') or (None, None)."""
    if not shutil.which("say"):
        return None, None
    try:
        listing = subprocess.run(["say", "-v", "?"], capture_output=True, text=True, timeout=20).stdout
    except Exception:
        return None, None
    voices = []
    for line in listing.splitlines():
        m = re.match(r"^(.+?)\s{2,}([a-z]{2,3}[_-][A-Za-z0-9]+)\s", line)
        if m:
            voices.append((m.group(1).strip(), m.group(2)))
    for name, loc in voices:
        if loc.lower().startswith("ur"):
            return name, "ur"
    hindi = [v for v in voices if v[1].lower().startswith("hi")]
    if hindi:
        # prefer an enhanced/premium voice if installed
        hindi.sort(key=lambda v: 0 if ("Enhanced" in v[0] or "Premium" in v[0]) else 1)
        return hindi[0][0], "hi"
    return None, None


def say_clip(voice, text, out):
    with tempfile.TemporaryDirectory() as td:
        aiff = Path(td) / "c.aiff"
        subprocess.run(["say", "-v", voice, "-r", "145", "-o", str(aiff), text], check=True, timeout=60)
        subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", str(aiff), str(out)], check=True, timeout=60)
    return out.exists() and out.stat().st_size > 500


def main():
    words = load_words()
    OUT.mkdir(parents=True, exist_ok=True)
    CUSTOM.mkdir(exist_ok=True)
    final = {}
    sources = {"yours": 0, "kept": 0, "neural": 0, "mac": 0}

    todo = []
    for cid, w in words.items():
        mine = existing(CUSTOM, cid)
        if mine:
            # drop any older generated version so the manifest points at yours
            for ext in AUDIO_EXT:
                old = OUT / f"{cid}{ext}"
                if old.exists():
                    old.unlink()
            dest = OUT / f"{cid}{mine.suffix.lower()}"
            shutil.copyfile(mine, dest)
            final[cid] = dest
            sources["yours"] += 1
            continue
        have = None if FORCE else existing(OUT, cid)
        if have:
            final[cid] = have
            sources["kept"] += 1
            continue
        todo.append((cid, w["ur"]))

    if todo:
        print(f"→ Generating {len(todo)} Urdu clips with the neural voice {VOICE} …")
        made = asyncio.run(edge_batch(todo))
        final.update(made)
        sources["neural"] += len(made)
        todo = [(c, t) for c, t in todo if c not in made]

    if todo:
        name, lang = mac_voice()
        if name:
            print(f"→ Using the Mac's '{name}' voice ({'Urdu' if lang == 'ur' else 'Hindi, reading the same words'}) for {len(todo)} clips …")
            for cid, _ in todo:
                text = words[cid]["ur"] if lang == "ur" else words[cid].get("hi") or words[cid]["ur"]
                out = OUT / f"{cid}.m4a"
                try:
                    if say_clip(name, text, out):
                        final[cid] = out
                        sources["mac"] += 1
                except Exception as e:
                    print(f"  · {cid}: {e}")
            todo = [(c, t) for c, t in todo if c not in final]

    manifest = {cid: f"voice/{p.name}" for cid, p in sorted(final.items())}
    (OUT / "manifest.js").write_text(
        "// generated by tools/make_voices.py\nwindow.VOICE_FILES = " + json.dumps(manifest, ensure_ascii=False, indent=1) + ";\n",
        encoding="utf-8",
    )
    print(f"✓ Voice clips: {sources['yours']} yours, {sources['neural']} neural, {sources['mac']} Mac voice, {sources['kept']} kept from before"
          + (f", {len(todo)} will be spoken live" if todo else ""))
    if todo:
        print("  Missing:", ", ".join(c for c, _ in todo))


if __name__ == "__main__":
    main()
