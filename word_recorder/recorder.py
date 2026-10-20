#!/usr/bin/env python3
"""Word Recorder for Urdu Doodles — record every game word in your own voice.

Run:  python3 word_recorder/recorder.py      (or double-click "Record Words.command")
It opens a page in your browser. Recordings are saved as my-voice/<word-id>.wav,
which ./build.sh then uses instead of any computer voice.
"""
import json
import re
import sys
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
WORDS_JS = ROOT / "game" / "words.js"
VOICE_DIR = ROOT / "my-voice"
AUDIO_EXT = (".m4a", ".mp3", ".wav", ".aiff", ".aif", ".caf")
MAX_UPLOAD = 20 * 1024 * 1024


def load_words():
    text = WORDS_JS.read_text(encoding="utf-8")
    start = text.index("{", text.index("window.WORDS"))
    return json.loads(text[start:text.rindex("}") + 1])


def recorded(cid):
    for ext in AUDIO_EXT:
        p = VOICE_DIR / f"{cid}{ext}"
        if p.exists() and p.stat().st_size > 800:
            return p
    return None


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):  # keep the terminal quiet
        pass

    def send(self, code, body=b"", ctype="text/plain; charset=utf-8"):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def word_id(self, prefix):
        cid = self.path[len(prefix):].split("?")[0]
        if not re.fullmatch(r"[a-z0-9_]+", cid) or cid not in load_words():
            self.send(404, b"unknown word")
            return None
        return cid

    def do_GET(self):
        path = self.path.split("?")[0]
        if path in ("/", "/index.html"):
            self.send(200, (HERE / "index.html").read_bytes(), "text/html; charset=utf-8")
        elif path == "/words":
            words = load_words()
            done = {cid: bool(recorded(cid)) for cid in words}
            self.send(200, json.dumps({"words": words, "done": done}, ensure_ascii=False).encode("utf-8"),
                      "application/json; charset=utf-8")
        elif path.startswith("/clip/"):
            cid = self.word_id("/clip/")
            if not cid:
                return
            p = recorded(cid)
            if not p:
                return self.send(404, b"not recorded")
            types = {".wav": "audio/wav", ".mp3": "audio/mpeg", ".m4a": "audio/mp4"}
            self.send(200, p.read_bytes(), types.get(p.suffix, "application/octet-stream"))
        else:
            self.send(404, b"not found")

    def do_PUT(self):
        if not self.path.startswith("/save/"):
            return self.send(404, b"not found")
        cid = self.word_id("/save/")
        if not cid:
            return
        n = int(self.headers.get("Content-Length") or 0)
        if n <= 44 or n > MAX_UPLOAD:
            return self.send(400, b"bad size")
        data = self.rfile.read(n)
        if data[:4] != b"RIFF" or data[8:12] != b"WAVE":
            return self.send(400, b"expected a WAV file")
        VOICE_DIR.mkdir(exist_ok=True)
        for ext in AUDIO_EXT:  # one recording per word, so the newest always wins
            old = VOICE_DIR / f"{cid}{ext}"
            if old.exists():
                old.unlink()
        (VOICE_DIR / f"{cid}.wav").write_bytes(data)
        self.send(200, b"saved")

    def do_DELETE(self):
        if not self.path.startswith("/clip/"):
            return self.send(404, b"not found")
        cid = self.word_id("/clip/")
        if not cid:
            return
        for ext in AUDIO_EXT:
            p = VOICE_DIR / f"{cid}{ext}"
            if p.exists():
                p.unlink()
        self.send(200, b"deleted")


def main():
    server = None
    for port in range(8765, 8790):
        try:
            server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
            break
        except OSError:
            continue
    if not server:
        sys.exit("Couldn't find a free port.")
    url = f"http://localhost:{server.server_port}/"
    print(f"\n  🎙  Word Recorder is running at {url}")
    print(f"     Recordings go to {VOICE_DIR}")
    print("     When you're done: close this window (or press Ctrl+C), then run ./build.sh\n")
    threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Bye! Now run ./build.sh to put your voice in the game.\n")


if __name__ == "__main__":
    main()
