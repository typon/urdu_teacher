#!/usr/bin/env python3
"""Record the spoken Urdu clips for Urdu Doodles.

Voice engines, best first (the first one you have a key for is used, or pick with URDU_TTS=…):

  elevenlabs  ElevenLabs Eleven v4 — very expressive, supports Urdu.     ELEVENLABS_API_KEY
  uplift      Uplift AI "Orator" — built specifically for Pakistani Urdu.  UPLIFT_API_KEY
  gemini      Google Gemini TTS — style-promptable (Urdu not officially listed).  GEMINI_API_KEY
  edge        Microsoft's free Azure voice (no key; flat and robotic)
  mac         the Mac's own `say` voices (last resort)

Put keys in a file called `.env` next to build.sh (it is git-ignored), e.g.
    ELEVENLABS_API_KEY=sk_...
    ELEVENLABS_VOICE_ID=...        # optional: any voice from your ElevenLabs library

Your own recordings in my-voice/<clip-id>.(m4a|mp3|wav|aiff) always win over any engine.

Flags:
  --audition        record 5 sample words with every engine you have keys for and open a
                    page to compare them side by side (doesn't touch the game's clips)
  --force           re-record every clip
  --only a_cat,n7   re-record just these clips (e.g. after fixing a spelling in words.js)
"""
import asyncio
import base64
import html
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GAME = ROOT / "game"
OUT = GAME / "voice"
CUSTOM = ROOT / "my-voice"
AUDITION = ROOT / "audition"
AUDIO_EXT = (".m4a", ".mp3", ".wav", ".aiff", ".aif", ".caf")
SAMPLE_IDS = ["a_cat", "s_duck", "c_purple", "n7", "f_apples"]

# What a warm parent says just before each clip. ElevenLabs uses it as context for the
# delivery (it is not spoken), which pulls the tone towards "talking to my baby".
CONTEXT_BEFORE = "ارے واہ! دیکھو دیکھو، میری جان!"
GEMINI_STYLE = ("A loving Pakistani mother playing with her one-year-old: warm, delighted, "
                "playful and sing-song, slow and very clear Urdu.")


# ───────────────────────── setup ─────────────────────────
def load_env():
    f = ROOT / ".env"
    if f.exists():
        for line in f.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def env(name, default=None):
    v = os.environ.get(name, "").strip()
    return v or default


def load_words():
    text = (GAME / "words.js").read_text(encoding="utf-8")
    start = text.index("{", text.index("window.WORDS"))
    return json.loads(text[start:text.rindex("}") + 1])


def kind(cid):
    if cid == "e_full":
        return "cheer"
    if cid.startswith(("s_", "e_")):
        return "sound"
    if cid.startswith("f_"):
        return "cheer"
    return "word"


def http(url, body=None, headers=None, timeout=60):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers or {}, method="POST" if data else "GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")[:300]
        raise RuntimeError(f"HTTP {e.code}: {detail}") from None


def good(path):
    return path.exists() and path.stat().st_size > 800


# ───────────────────────── engines ─────────────────────────
# Each engine: available() -> reason it can't run, or None; make(word, clip_id, path_stem) -> Path

class ElevenLabs:
    name, label = "elevenlabs", "ElevenLabs v4"
    TAGS = {"word": "[excited]", "sound": "[playful]", "cheer": "[cheering]"}

    def available(self):
        return None if env("ELEVENLABS_API_KEY") else "no ELEVENLABS_API_KEY"

    def make(self, w, cid, stem):
        voice = env("ELEVENLABS_VOICE_ID", "EXAVITQu4vr4xnSDxMaL")  # "Sarah" — swap for a native Urdu voice
        model = env("ELEVENLABS_MODEL", "eleven_v4")
        tag = env("ELEVENLABS_TAG") or self.TAGS[kind(cid)]
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128"
        headers = {"xi-api-key": env("ELEVENLABS_API_KEY"), "Content-Type": "application/json", "Accept": "audio/mpeg"}
        body = {"text": f"{tag} {w['say']}".strip(), "model_id": model,
                "language_code": "ur", "previous_text": CONTEXT_BEFORE}
        try:
            audio = http(url, body, headers)
        except RuntimeError as e:
            if "HTTP 4" not in str(e) or "HTTP 401" in str(e):
                raise
            # some models reject language_code / previous_text — try the plain request
            audio = http(url, {"text": body["text"], "model_id": model}, headers)
        out = stem.with_suffix(".mp3")
        out.write_bytes(audio)
        return out


class Uplift:
    name, label = "uplift", "Uplift AI Orator"

    def available(self):
        return None if env("UPLIFT_API_KEY") else "no UPLIFT_API_KEY"

    def make(self, w, cid, stem):
        body = {"text": w["say"], "voiceId": env("UPLIFT_VOICE_ID", "v_8eelc901"), "outputFormat": "MP3_22050_128"}
        audio = http("https://api.upliftai.org/v1/synthesis/text-to-speech", body,
                     {"Authorization": f"Bearer {env('UPLIFT_API_KEY')}", "Content-Type": "application/json"})
        if audio[:1] == b"{":
            raise RuntimeError(audio[:200].decode("utf-8", "replace"))
        out = stem.with_suffix(".mp3")
        out.write_bytes(audio)
        return out


class Gemini:
    name, label = "gemini", "Gemini TTS"

    def available(self):
        return None if env("GEMINI_API_KEY") else "no GEMINI_API_KEY"

    def make(self, w, cid, stem):
        style = env("GEMINI_STYLE", GEMINI_STYLE)
        if kind(cid) == "cheer":
            style += " Cheering proudly."
        style += f' Pronounced: "{w["roman"]}".'
        body = {
            "model": env("GEMINI_TTS_MODEL", "gemini-3.8-flash-tts"),
            "input": [{"type": "user_input", "content": [{
                "type": "text", "text": w["say"],
                "annotations": [{"type": "speech_metadata", "style": style}]}]}],
            "response_format": {"type": "audio"},
            "generation_config": {"speech_config": [{"voice": env("GEMINI_VOICE", "Sulafat")}]},
        }
        raw = http("https://generativelanguage.googleapis.com/v1beta/interactions", body,
                   {"x-goog-api-key": env("GEMINI_API_KEY"), "Content-Type": "application/json"}, timeout=120)
        resp = json.loads(raw)
        audio = None
        for step in resp.get("steps", []):
            if step.get("type") != "model_output":
                continue
            for c in step.get("content", []):
                if c.get("type") == "audio" and c.get("data"):
                    audio = c["data"]
        if not audio:
            raise RuntimeError("no audio in response: " + raw[:200].decode("utf-8", "replace"))
        out = stem.with_suffix(".wav")
        out.write_bytes(base64.b64decode(audio))
        return out


class Edge:
    name, label = "edge", "Microsoft (free)"

    def available(self):
        try:
            import edge_tts  # noqa: F401
            return None
        except Exception:
            return "edge-tts not installed"

    def make(self, w, cid, stem):
        import edge_tts
        out = stem.with_suffix(".mp3")
        voice = env("URDU_VOICE", "ur-PK-UzmaNeural")
        asyncio.run(edge_tts.Communicate(w["say"], voice, rate=env("URDU_RATE", "-12%"),
                                         pitch=env("URDU_PITCH", "+6Hz")).save(str(out)))
        return out


class Mac:
    name, label = "mac", "Mac voice"

    def __init__(self):
        self._voice = None

    def voice(self):
        if self._voice is None:
            self._voice = (None, None)
            if shutil.which("say"):
                listing = subprocess.run(["say", "-v", "?"], capture_output=True, text=True, timeout=20).stdout
                voices = [(m.group(1).strip(), m.group(2)) for m in
                          (re.match(r"^(.+?)\s{2,}([a-z]{2,3}[_-][A-Za-z0-9]+)\s", l) for l in listing.splitlines()) if m]
                ur = [v for v in voices if v[1].lower().startswith("ur")]
                hi = sorted([v for v in voices if v[1].lower().startswith("hi")],
                            key=lambda v: 0 if ("Enhanced" in v[0] or "Premium" in v[0]) else 1)
                if ur:
                    self._voice = (ur[0][0], "ur")
                elif hi:
                    self._voice = (hi[0][0], "hi")
        return self._voice

    def available(self):
        return None if self.voice()[0] else "no Urdu/Hindi voice installed"

    def make(self, w, cid, stem):
        name, lang = self.voice()
        text = w["ur"] if lang == "ur" else (w.get("hi") or w["ur"])
        out = stem.with_suffix(".m4a")
        with tempfile.TemporaryDirectory() as td:
            aiff = Path(td) / "c.aiff"
            subprocess.run(["say", "-v", name, "-r", "145", "-o", str(aiff), text], check=True, timeout=60)
            subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", str(aiff), str(out)], check=True, timeout=60)
        return out


ENGINES = [ElevenLabs(), Uplift(), Gemini(), Edge(), Mac()]


def record(engine, w, cid, stem):
    last = None
    for attempt in range(3):
        try:
            p = engine.make(w, cid, stem)
            if good(p):
                return p
            last = "empty audio"
        except Exception as e:  # network hiccups, throttling
            last = e
            if "HTTP 401" in str(e) or "HTTP 403" in str(e):
                break
        time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(str(last))


def pick_engine():
    wanted = env("URDU_TTS")
    if wanted:
        for e in ENGINES:
            if e.name == wanted:
                why = e.available()
                if why:
                    print(f"  ! URDU_TTS={wanted} but {why}; picking another engine")
                    break
                return e
    for e in ENGINES:
        if not e.available():
            return e
    return None


# ───────────────────────── audition page ─────────────────────────
def audition(words):
    usable = [e for e in ENGINES if not e.available()]
    skipped = [(e.label, e.available()) for e in ENGINES if e.available()]
    if AUDITION.exists():
        shutil.rmtree(AUDITION)
    AUDITION.mkdir()
    cells = {}
    for e in usable:
        print(f"→ {e.label}")
        (AUDITION / e.name).mkdir()
        for cid in SAMPLE_IDS:
            try:
                p = record(e, words[cid], cid, AUDITION / e.name / cid)
                cells[(e.name, cid)] = p.relative_to(AUDITION).as_posix()
                print(f"  · {cid:10s} ok")
            except Exception as err:
                cells[(e.name, cid)] = None
                print(f"  · {cid:10s} failed: {err}")
    head = "".join(f"<th>{html.escape(e.label)}</th>" for e in usable)
    rows = ""
    for cid in SAMPLE_IDS:
        w = words[cid]
        tds = "".join(
            f'<td><audio controls preload="auto" src="{html.escape(cells[(e.name, cid)])}"></audio></td>'
            if cells.get((e.name, cid)) else "<td class=x>failed</td>" for e in usable)
        rows += f'<tr><td><div class=ur>{html.escape(w["ur"])}</div><div class=ro>{html.escape(w["roman"])}</div></td>{tds}</tr>'
    note = "".join(f"<li>{html.escape(l)} — {html.escape(r)}</li>" for l, r in skipped)
    page = f"""<!doctype html><meta charset=utf-8><title>Urdu voice audition</title>
<style>body{{font-family:-apple-system,system-ui,sans-serif;background:#fbf3e2;color:#3b2a20;padding:24px}}
table{{border-collapse:collapse}}td,th{{border:2px solid #3b2a20;padding:10px 14px;text-align:center}}
.ur{{font-family:"Noto Nastaliq Urdu","Geeza Pro",serif;font-size:28px;line-height:1.9}}.ro{{opacity:.7}}.x{{opacity:.5}}</style>
<h1>Which voice sounds best?</h1>
<p>Then put e.g. <code>URDU_TTS=elevenlabs</code> in <code>.env</code> and run <code>./build.sh</code>.</p>
<table><tr><th>word</th>{head}</tr>{rows}</table>
{"<p>Not tried:</p><ul>" + note + "</ul>" if note else ""}"""
    (AUDITION / "index.html").write_text(page, encoding="utf-8")
    print(f"✓ Open {AUDITION / 'index.html'}")
    if shutil.which("open"):
        subprocess.run(["open", str(AUDITION / "index.html")])


# ───────────────────────── main ─────────────────────────
def main():
    load_env()
    words = load_words()
    if "--audition" in sys.argv:
        audition(words)
        return

    force = "--force" in sys.argv
    only = set()
    if "--only" in sys.argv:
        i = sys.argv.index("--only")
        if i + 1 < len(sys.argv):
            only = {x.strip() for x in sys.argv[i + 1].split(",") if x.strip()}
        unknown = only - set(words)
        if unknown:
            print("  ! unknown clip ids:", ", ".join(sorted(unknown)))

    OUT.mkdir(parents=True, exist_ok=True)
    CUSTOM.mkdir(exist_ok=True)
    src_file = OUT / "sources.json"
    try:
        sources = json.loads(src_file.read_text())
    except Exception:
        sources = {}

    engine = pick_engine()
    print(f"→ Voice engine: {engine.label if engine else 'none available'}")

    def clear(cid):
        for ext in AUDIO_EXT:
            p = OUT / f"{cid}{ext}"
            if p.exists():
                p.unlink()

    final, counts, failed = {}, {}, []
    for cid, w in words.items():
        mine = next((CUSTOM / f"{cid}{e}" for e in AUDIO_EXT if good(CUSTOM / f"{cid}{e}")), None)
        if mine:
            clear(cid)
            dest = OUT / f"{cid}{mine.suffix.lower()}"
            shutil.copyfile(mine, dest)
            final[cid], sources[cid] = dest, "yours"
            counts["yours"] = counts.get("yours", 0) + 1
            continue
        have = next((OUT / f"{cid}{e}" for e in AUDIO_EXT if good(OUT / f"{cid}{e}")), None)
        # re-record when asked, or when the clip came from a different engine than the chosen one
        redo = force or cid in only or (engine is not None and sources.get(cid) != engine.name)
        if have and not redo:
            final[cid] = have
            counts["kept"] = counts.get("kept", 0) + 1
            continue
        tried = [engine] if engine else []
        tried += [e for e in ENGINES if e is not engine and e.name in ("edge", "mac") and not e.available()]
        for e in tried:
            try:
                p = record(e, w, cid, OUT / f".new_{cid}")
                clear(cid)
                dest = OUT / f"{cid}{p.suffix}"
                p.replace(dest)
                final[cid], sources[cid] = dest, e.name
                counts[e.label] = counts.get(e.label, 0) + 1
                print(f"  · {cid:12s} {w['ur']:<18s} {e.label}")
                break
            except Exception as err:
                print(f"  · {cid:12s} {e.label} failed: {err}")
        else:
            if have:
                final[cid] = have  # keep the old clip rather than nothing
            else:
                failed.append(cid)

    manifest = {cid: f"voice/{p.name}" for cid, p in sorted(final.items())}
    (OUT / "manifest.js").write_text(
        "// generated by tools/make_voices.py\nwindow.VOICE_FILES = "
        + json.dumps(manifest, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    src_file.write_text(json.dumps(sources, indent=1))
    print("✓ Voice clips: " + ", ".join(f"{n} {k}" for k, n in counts.items())
          + (f"; {len(failed)} will be spoken live ({', '.join(failed)})" if failed else ""))


if __name__ == "__main__":
    main()
