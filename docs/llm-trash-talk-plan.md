# Going Live with the LLM Mouth — Model, Infrastructure & Backend Plan

*Written 2026-07-03, after archiving `add-live-trash-talk`. Everything here plugs into
the seams that change deliberately built: `persona.md` is the system prompt,
`TrashTalkMoment` is the user prompt, and `activeLineSource` in
`src/services/lineSource.ts` is the single line of code that flips the switch.*

---

## TL;DR — the recommendation

| Decision | Pick | Why in one line |
|---|---|---|
| **Model** | **Claude Haiku 4.5** (`claude-haiku-4-5-20251001`) | Fast enough for a speech bubble, cheap enough to fire every move, great at holding a voice |
| **Infrastructure** | **Azure Static Web Apps** (SPA) **+ its built-in Azure Functions API** | One resource, free tier, CORS handled, secrets server-side, and it's the Azure you already know |
| **Backend language** | **C# / .NET 8 (Functions isolated worker)** | ~100 lines total — the perfect-sized project to learn .NET without risk |
| **Bridge phase** | Dev-only direct API calls with your own key in `.env.local` | Prove the prompt is funny *before* building anything |

Total running cost for a hobby project: **≈ $0 infrastructure + a few cents per game** in tokens.

---

## 1. The model

### What the job actually is

One call per move: `persona.md` (~700 tokens, never changes) + player brief (~200 tokens,
fixed per game) + one `TrashTalkMoment` JSON (~250 tokens) in → **one line under 120
characters** out. That's a tiny, latency-sensitive, high-frequency, personality-heavy task.
This is the textbook profile for a small fast model, not a frontier one.

### Recommendation: Claude Haiku 4.5

- **Latency**: typically well under a second for a 40-token completion — comfortably inside
  the `SOURCE_TIMEOUT_MS` (2.5 s) budget in `lineSource.ts`, with the static bank as the
  safety net if it ever isn't.
- **Voice**: Haiku-class models are genuinely good at "stay in this character, be short,
  be funny" when the persona is explicit — and yours already is (`src/data/persona.md`
  was written to be a system prompt).
- **Tone handling**: playful profanity within your persona's stated hard limits is fine;
  the persona's own guardrails ("roast the chess, never the human") do the policy work.
- **Cost** (approx., order-of-magnitude): ~$1 / M input tokens, ~$5 / M output.
  Naively ~$0.0015/move → **~6¢ per 40-move game**. With **prompt caching** (see below)
  closer to **~2¢ per game**.

### Two force multipliers

1. **Prompt caching.** The persona + player brief are identical for every call in a game.
   Mark them as cacheable system blocks (`cache_control: { type: "ephemeral" }`) and every
   call after the first reads them at ~10% of input price *and* responds faster. This is
   the single best optimization available and it's one field in the request.
2. **A splash of Sonnet where it counts.** Consider `claude-sonnet-5` for exactly **one**
   call per game: a pre-game opener that digests the full scouting brief into a personalized
   greeting ("Ah, Victim. 6 years, still 800. Sit down."). One Sonnet call per game costs
   about as much as a whole game of Haiku lines and sets the tone. Optional, phase 2.

### The Azure route to the same model

Claude models (including Haiku 4.5) are available through **Microsoft Foundry**
(Azure AI). If you'd rather keep billing, quotas, and keys inside your Azure subscription,
you can call the same model via a Foundry deployment instead of the Anthropic API directly.
Functionally equivalent for this project — pick whichever billing relationship you prefer.
The Anthropic API directly is slightly simpler to start with (one key, one REST endpoint).

### What about a local/free model?

Running something tiny in the browser (WebLLM etc.) keeps the "no backend" purity, but:
2–4 GB downloads, weak humor, slow first token on modest hardware. The whole feature *is*
the joke quality — don't compromise it. The static bank already covers offline/free mode.

---

## 2. The infrastructure

### Why you need a backend at all

One reason only: **the API key can never ship in the SPA bundle.** Anyone can read it,
and then they're roasting people on your credit card. The backend is a key-holding proxy
with a rate limit — nothing more. That means the smallest possible serverless footprint wins.

### Recommendation: Azure Static Web Apps + managed Functions API

Your app is a static Vite bundle plus one tiny API — which is *exactly* the shape Azure
Static Web Apps (SWA) is designed for:

```
repo/
├── src/…                  ← Vite SPA (deployed to SWA's CDN)
├── public/engine/…        ← Stockfish WASM, served as static assets
└── api/                   ← Azure Functions project (.NET 8 isolated)
    └── TrashTalk.cs       ← POST /api/trash-talk
```

- **One resource, one deploy** — the GitHub Action builds both halves; the API is served
  from the same origin (`/api/*`), so **no CORS configuration at all**.
- **Free tier** covers this entirely (100 GB bandwidth/mo, managed functions included).
- **Secrets** (`ANTHROPIC_API_KEY`) live in SWA application settings — server-side only.
  Graduate to Key Vault references later if you feel like doing it properly.
- **It's Azure** — your existing mental model, portal, and account apply, while the SWA +
  Functions combo will still feel new enough to be worth learning.

### The one gotcha: cold starts

A .NET isolated function that hasn't run for ~20 minutes can take 1–3 s to wake up — which
would blow the 2.5 s line budget for the *first* line of a session. Three cheap mitigations,
use the first two:

1. **You already built the fix**: `resolveLine` falls back to the static bank on timeout.
   Worst case, move 1 gets a canned line and move 2 onward gets the LLM. Zero work.
2. **Warm it on purpose**: when `GameScreen` mounts and the chess engine starts its
   handshake, fire a throwaway `fetch('/api/warmup')`. By the time the player has made a
   move and Stockfish has replied, the function is warm. ~5 lines of code.
3. (If it ever matters) SWA's paid tier / a standalone Flex Consumption plan reduces cold
   starts — overkill for now.

### Alternatives considered

| Option | Verdict |
|---|---|
| **Azure Functions standalone + any static host** | Same result, two resources and manual CORS — SWA is just less to manage |
| **Cloudflare Workers (+ Pages)** | The technically slickest option: ~0 ms cold starts, generous free tier. But it's JS/TS only — it kills your .NET goal. Keep it in mind if cold starts ever annoy you |
| **AWS Lambda + CloudFront/Amplify** | Perfectly fine, no advantage over Azure for you, new console to learn for no payoff |
| **A real always-on server (App Service, container)** | Paying monthly for a proxy that runs 0.1% of the time — no |

---

## 3. The backend (what to actually build)

### Contract

Mirror the frontend seam exactly — the request body **is** the `TrashTalkMoment`
(`src/types/trashTalk.types.ts`), the response **is** a `PickedLine`:

```
POST /api/trash-talk
Content-Type: application/json

{ ...TrashTalkMoment }          →  200 { "id": "llm-<uuid>", "text": "one line" }
                                   4xx/5xx / timeout → frontend falls back to static bank
```

Keep `persona.md` **in the backend** as the system prompt source of truth (copy it into
the `api/` project or embed it at build time). The frontend keeps its copy only for the
static bank's benefit.

### C# skeleton (.NET 8 isolated worker)

The whole function, minus ceremony (this is the shape, not gospel):

```csharp
public class TrashTalk(IHttpClientFactory httpFactory)
{
    private static readonly string Persona = File.ReadAllText(
        Path.Combine(AppContext.BaseDirectory, "persona.md"));

    [Function("trash-talk")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequestData req)
    {
        var moment = await req.ReadFromJsonAsync<JsonElement>();

        var payload = new
        {
            model = "claude-haiku-4-5-20251001",
            max_tokens = 100,
            temperature = 1.0,
            system = new object[]
            {
                // Cached across calls: ~90% cheaper + faster after the first line.
                new { type = "text", text = Persona,
                      cache_control = new { type = "ephemeral" } },
            },
            messages = new object[]
            {
                new { role = "user", content =
                    $"The moment, as JSON:\n{moment}\n\n" +
                    "Reply with the one-liner only. No quotes, no preamble." },
            },
        };

        var http = httpFactory.CreateClient("anthropic"); // BaseAddress + x-api-key
        var api = await http.PostAsJsonAsync("/v1/messages", payload);
        var body = await api.Content.ReadFromJsonAsync<JsonElement>();
        var text = body.GetProperty("content")[0].GetProperty("text").GetString();

        var res = req.CreateResponse(HttpStatusCode.OK);
        await res.WriteAsJsonAsync(new { id = $"llm-{Guid.NewGuid():N}", text });
        return res;
    }
}
```

Notes for the .NET-learner version of you:

- **SDK choice**: you can use an Anthropic SDK package if you like, but honestly the API is
  one POST — `HttpClient` + anonymous types (as above) teaches you more .NET and adds zero
  dependencies. If you go the Azure Foundry route instead, use the Azure AI inference SDK
  for .NET.
- **Rate limiting**: SWA gives you nothing built-in on the free tier. Simplest effective
  guard: an in-memory sliding window per IP inside the function (fine for a single-instance
  hobby app), plus a hard monthly **budget cap on the API key** in the Anthropic/Azure
  console so the worst case is bounded by construction.
- **Timeout discipline**: set the outbound HttpClient timeout to ~2 s so your function
  answers (with an error) before the frontend gives up — failing fast is what makes the
  static-bank fallback seamless.
- **persona.md deployment**: mark it `CopyToOutputDirectory` in the `.csproj` so
  `File.ReadAllText` finds it beside the compiled function.

### Frontend: the 30-line other half

```ts
// src/services/lineSource.ts — the swap the whole architecture was built for
const llmLineSource: LineSource = async (moment) => {
  const res = await fetch('/api/trash-talk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(moment),
  })
  if (!res.ok) return null            // resolveLine falls back to the bank
  return (await res.json()) as PickedLine
}

export const activeLineSource: LineSource = llmLineSource  // ← the one-line flip
```

`resolveLine`'s timeout/fallback and the hook's stale-guard already handle every failure
mode — slow LLM, dead backend, offline play — with zero further changes. Consider bumping
`SOURCE_TIMEOUT_MS` from 2500 → 4000 for the LLM era; the bubble appearing half a beat
later is invisible, a fallback to a canned line is not.

One small addition worth making: append the last ~5 lines actually said (already tracked in
`session.saidLineIds` — extend to texts) to the user prompt so the model doesn't repeat its
own jokes. The moment payload was designed to grow this way.

---

## 4. Language choice, settled

- **Python**: you'd be done in an hour, learn nothing new. Azure Functions supports it fine.
- **JS/TS**: shares types with the frontend (genuinely nice — you could import
  `TrashTalkMoment` directly), also nothing new. The right choice *if* you ever migrate to
  Cloudflare Workers.
- **C#/.NET** ✅: ~100 lines of real but low-stakes code touching the actual .NET things
  worth learning — the isolated worker model, DI (`IHttpClientFactory`), `System.Text.Json`,
  deployment. If it goes badly, you rewrite it in TS in an afternoon. If it goes well,
  you've learned .NET on a project you care about. **This is the one.**

The only real cost of .NET here: you can't share the `TrashTalkMoment` type with the
frontend. Mitigate by treating the JSON loosely on the C# side (as the skeleton does with
`JsonElement`) — the backend mostly just forwards the moment to the model anyway.

---

## 5. Phased plan

**Phase 0 — prove the funny (an evening, no backend)**
Write `llmLineSource` calling the Anthropic API directly with a key from `.env.local`
(`VITE_ANTHROPIC_KEY`, direct-browser-access header, **dev only — never build/deploy this**).
Play ten games. Tune `persona.md` until the lines consistently land. This is where 90% of
the product quality gets decided, and it needs zero infrastructure.

**Phase 1 — the real backend (a weekend)**
Azure Static Web App + `api/` .NET function as above. Key in app settings, budget cap on,
warmup ping, swap the fetch URL from Anthropic to `/api/trash-talk`. Delete the Phase 0
key path entirely.

**Phase 2 — polish (whenever)**
Prompt caching (if not done in Phase 1), the Sonnet pre-game opener, said-lines context to
prevent repeats, maybe difficulty-flavored persona variants ("easy mode is condescendingly
gentle").

When you're ready to start any phase: `/opsx:propose` and this document becomes the raw
material for the proposal.

---

## 6. Cost reality check (approximate)

| Item | Monthly (hobby usage: ~50 games) |
|---|---|
| Azure Static Web Apps (free tier) | $0 |
| Managed Functions (free grant) | $0 |
| Haiku 4.5 tokens, ~40 lines/game, with caching | ~$1–2 |
| Optional Sonnet 5 opener, 1/game | ~$0.50 |
| **Total** | **≈ $2/month** |

The budget cap makes the downside bounded; the static bank makes the failure mode invisible.
There is no scenario where this project surprises you financially or breaks when the
backend is down — which is exactly what the last change was built to guarantee.
