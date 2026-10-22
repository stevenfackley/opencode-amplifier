# Local model hosting (Ollama) — optional

How to stand up an **optional** `ollama/…` tier — on your own machine or a LAN box.

> The kit ships with no local dependency: every pin is an `openrouter/…:free` slug and one API
> key runs the whole thing. Nothing here is required. Add this tier only if you want the chatty
> roles off your OpenRouter pool — and only if the server will actually be up, because a declared
> provider pointing at a dead host resolves silently and its agents fail with no useful error.

## 1. Why local

Two tiers, two scarcities. The **chatty** roles run constantly and cost you request quota you
can't spare: `reviewer-cheap` fires on every `/review`, `/commit` fires on every green step, and
the executor is a manual swap away from a local model when OpenRouter rate-limits (there is no
automatic fallback for the top-level `model` key). Locally these are $0 and unmetered — no 50/day
or 1,000/day ceiling, no 401 when a key expires, no data leaving the box.

The **bursty** roles (council fan-out, the 1M-ctx mapper, the strong reasoners) are worth
spending the OpenRouter free pool on: they run a handful of times per task and need model sizes
no 16GB box can hold. So: local = high-frequency/low-stakes, hosted = low-frequency/high-stakes.

A second benefit: local models keep working when the `:free` roster churns. If every hosted pin
404s tomorrow, re-pinning the agents to local tags gets you a degraded-but-running kit.

## 2. RAM-tier model menus

Verified 2026-08. Sizes are on-disk quantized weights; leave ~4GB headroom for the OS and KV
cache.

**16GB unified (the kit's default target)**

| Tag | Size | Role |
|---|---|---|
| `qwen3.5:9b` | 6.6GB | `reviewer-cheap` primary, `tester` fallback (262k ctx) |
| `ornith:9b` | 5.6GB | agentic coder — local executor alternative (MIT) |
| `qwen3.5:4b` | 3.4GB | `/commit` and other mechanical work |
| `qwen3-embedding:0.6b` | 0.6GB | embeddings for any retrieval you bolt on |
| `gemma4:12b-it-qat` | 7.2GB | *optional 5th* — family-diverse local alternative (256k) |

`gemma4:12b-it-qat` is declared in `opencode.jsonc`'s `ollama` provider but is not pinned by any
agent — it's there as a **manual re-pin target** when you want a non-Qwen local family (e.g.
moving `reviewer-cheap` off Qwen so it decorrelates from a Qwen executor). Pull it only if you'll
use it; with `OLLAMA_MAX_LOADED_MODELS=1` a 5th model costs disk, not RAM.

**32GB adds:** `qwen3.6:27b`, `qwen3-coder:30b`, `devstral-small-2:24b`.
**64GB adds:** 70B-class at Q4.

Two gotchas: there is **no small `qwen3-coder`** — the smallest is 30B, so on 16GB use `ornith:9b`
for coding instead. And **Ollama ≥0.32 is required** for the 2026 model families; older builds
fail the pull with an unknown-architecture error.

Context sizes don't constrain you locally: every local *chat* tag above is ≥256k (the embedding
model has no such window and needs none), so the "degraded fallback" warning on `mapper.md`
(whose hosted fallback drops 1M → 262k) has no local analogue — if you re-pin locally you're at
262k either way.

## 3. Install + serve (macOS)

```bash
brew install ollama
```

Do **not** use `brew services start ollama`. Brew regenerates its own plist on upgrade/restart and
silently clobbers any env edits you make to it — your `OLLAMA_MODELS` path and tuning vars
disappear at the worst possible moment. Use a dedicated LaunchAgent instead.

Write `~/Library/LaunchAgents/com.local.ollama.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.local.ollama</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string><string>-c</string>
    <string>until [ -d /Volumes/Models ]; do sleep 5; done; exec /opt/homebrew/opt/ollama/bin/ollama serve</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>OLLAMA_HOST</key><string>0.0.0.0:11434</string>
    <key>OLLAMA_MODELS</key><string>/Volumes/Models/ollama</string>
    <key>OLLAMA_FLASH_ATTENTION</key><string>1</string>
    <key>OLLAMA_KV_CACHE_TYPE</key><string>q8_0</string>
    <key>OLLAMA_MAX_LOADED_MODELS</key><string>1</string>
    <key>OLLAMA_NUM_PARALLEL</key><string>1</string>
    <key>OLLAMA_KEEP_ALIVE</key><string>30m</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/ollama.log</string>
  <key>StandardErrorPath</key><string>/tmp/ollama.log</string>
</dict>
</plist>
```

```bash
mkdir -p /Volumes/Models/ollama
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.local.ollama.plist
curl -s http://localhost:11434/api/version
```

Two details worth keeping. `OLLAMA_MODELS` points at an external volume so ~25GB of weights stay
off the boot drive — drop that key if you're serving from the boot drive. The
`until [ -d /Volumes/Models ]` pre-flight is not decoration: LaunchAgents start before external
volumes finish mounting, and Ollama started with a missing store directory happily creates an
empty one on the boot drive and reports zero models. The loop waits instead.

Keep the path as `/opt/homebrew/opt/ollama/bin/ollama` (not `/opt/homebrew/Cellar/...`) — the
`opt` path is a symlink Homebrew re-points on upgrade, so `brew upgrade ollama` won't break the
plist.

**TCC gotcha (external volumes only, field-verified):** macOS privacy controls block
launchd-spawned processes from external volumes — the agent starts, binds the port, then wedges
forever inside `mkdir` with nothing in the log. The same commands work over SSH (SSH sessions
inherit sshd's disk grant), which makes this maddening to debug. Fix: System Settings → Privacy
& Security → **Full Disk Access** → add `/opt/homebrew/opt/ollama/bin/ollama`. Re-check the
grant after `brew upgrade ollama` — the binary is ad-hoc-signed and can lose its TCC entry.
Serving from the boot drive needs none of this. Restart the server after granting — a
running instance doesn't pick the grant up. One aftershock: blob partials written *before*
the grant can poison resume *after* it — `ollama pull` dies instantly with `Error: EOF` at
the manifest step and nothing in the server log, even with `OLLAMA_DEBUG=1`. Fix:
`rm $OLLAMA_MODELS/blobs/*-partial*` and re-pull.

Two more field notes: `brew services restart ollama` regenerates Homebrew's own plist and
silently resets `OLLAMA_HOST` to `127.0.0.1` — exactly why this guide uses a dedicated
LaunchAgent instead of `brew services`. And `diskutil eraseDisk` over plain SSH can hang
silently waiting for authorization; run it with `ssh -tt` (or at the machine).

## 4. LAN exposure + addressing

By default Ollama binds `127.0.0.1` and is unreachable from other machines. `OLLAMA_HOST=0.0.0.0:11434`
(set in the plist above) binds all interfaces.

Never point a client at a DHCP-assigned IP — it will change and every agent pin breaks at once.
Two stable options:

```bash
# mDNS name (simplest): the box answers to macmini.local on the LAN
sudo scutil --set ComputerName macmini
sudo scutil --set LocalHostName macmini
sudo scutil --set HostName macmini
```

or a DHCP reservation on the router, tying the MAC to a fixed address.

Verify from the client:

```bash
ping -c 1 macmini.local
curl -s http://macmini.local:11434/api/tags
```

Client side: copy the `provider.ollama` block from `examples/opencode.overlay.example.jsonc` into
your config and set `options.baseURL` to `http://macmini.local:11434/v1`. Then move the pins you
want local — the two the tier is designed for are:

| File | Ships as | Local swap |
|---|---|---|
| `.opencode/agent/reviewer-cheap.md` | `openrouter/google/gemma-4-26b-a4b-it:free` | `ollama/qwen3.5:9b` |
| `.opencode/command/commit.md` | `openrouter/nvidia/nemotron-3-nano-30b-a3b:free` | `ollama/qwen3.5:4b` |

Keep `reviewer-cheap` in a family that is neither the executor's (poolside) nor the primary
reviewer's (NVIDIA) — that decorrelation is the whole point of the `/review` consensus vote.
`node tools/doctor.mjs` round-trips any `ollama/*` primary over direct HTTP and will tell you if
the endpoint is dead.

## 5. 16GB tuning

These are the env vars in the plist, and why each one is there:

| Var | Value | Why |
|---|---|---|
| `OLLAMA_FLASH_ATTENTION` | `1` | Lower attention memory, faster prefill on Apple Silicon |
| `OLLAMA_KV_CACHE_TYPE` | `q8_0` | Quantized KV cache — roughly halves cache RAM at long context |
| `OLLAMA_MAX_LOADED_MODELS` | `1` | Never hold two models resident; on 16GB a second one triggers swap |
| `OLLAMA_NUM_PARALLEL` | `1` | One request at a time; parallel slots multiply KV cache RAM |
| `OLLAMA_KEEP_ALIVE` | `30m` | Keep the hot model resident between turns instead of reloading it |

The failure mode these prevent is silent: with defaults, a long-context review plus a second
loaded model pushes the machine into swap and tokens/sec collapses by an order of magnitude
without any error. Watch `ollama ps` and Activity Monitor's swap-used figure if throughput drops.

`OLLAMA_KEEP_ALIVE=30m` trades idle RAM for latency. On a dedicated server box that's the right
trade; on your daily driver drop it to `5m`.

## 6. Security

**Ollama's API is unauthenticated.** There is no key, no token, no user. Anything that can reach
port 11434 can run inference, list your models, and pull or delete them.

Rules:

- Bind `0.0.0.0` only on a LAN you trust. On a shared/guest network keep the default `127.0.0.1`.
- **Never** port-forward 11434 through your router, and never expose it to a public interface.
  Automated scanners find open Ollama instances within hours.
- Remote access = a VPN overlay (Tailscale is the low-friction option); point `baseURL` at the
  overlay address and leave the LAN binding alone.
- If you need it reachable from the open web anyway, put a reverse proxy with auth in front and
  bind Ollama itself back to localhost. Do not skip the auth layer.

## 7. Server duty checklist

If the box is a dedicated model server, four settings decide whether it's actually available:

```bash
sudo pmset -a sleep 0 displaysleep 10     # never sleep; screen may
defaults read /Library/Preferences/com.apple.loginwindow autoLoginUser
```

- **Sleep off.** A sleeping Mac drops the TCP listener; every agent call fails until someone
  wakes it.
- **Auto-login on.** A LaunchAgent (`~/Library/LaunchAgents`, `gui/$(id -u)` domain) only runs
  inside a logged-in user session. After a power blip the box reboots to the login window and
  Ollama never starts. Set it in System Settings → Users & Groups → Automatically log in as;
  it can't be done headlessly.
- **External store auto-mounts.** APFS/HFS volumes mount at boot by default; the plist's wait
  loop covers the ordering race. Confirm with `df -h /Volumes/Models` after a reboot.
- **Upgrades are safe.** `brew upgrade ollama` re-points `/opt/homebrew/opt/ollama` and the
  LaunchAgent picks it up on next restart: `launchctl kickstart -k gui/$(id -u)/com.local.ollama`.

Reboot test before you trust it: reboot, wait two minutes, then `curl -s http://macmini.local:11434/api/tags`
from another machine.

## 8. Alternatives

Ollama isn't the only OpenAI-compatible local server. Both of these drop into this kit by
changing **only** `provider.ollama.options.baseURL` — model tags and agent pins are unaffected.

- **LM Studio** — ships an MLX backend that runs roughly 20-30% faster than llama.cpp on Apple
  Silicon, and a GUI for browsing/quantizing models. Its server is OpenAI-compatible on
  `http://localhost:1234/v1`. Weaker as a headless service: it expects the app to be running,
  which is awkward on a login-window-only server box.
- **llama.cpp `llama-server`** — maximum control (per-model flags, custom quants, exact context
  and batch sizes, `--n-gpu-layers`). Serves OpenAI-compatible endpoints on
  `http://localhost:8080/v1`. You manage model files, launch args, and the service unit yourself;
  worth it when you're tuning a specific model, overkill when you just want four tags served.

Rule of thumb: Ollama for a set-and-forget server, LM Studio for interactive experimentation,
llama.cpp when you know exactly which flag you need.
