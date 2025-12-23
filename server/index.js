import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ CORS: 카페24에서 오는 요청 허용
app.use(
  cors({
    origin: ["https://nandarina7.cafe24.com", "http://nandarina7.cafe24.com"],
  })
);

// solved.ac 고급검색 문법: *b5..b1, *s5..s1, *g5..g1 ...
const TIER_QUERY = {
  bronze: "*b5..b1",
  silver: "*s5..s1",
  gold: "*g5..g1",
  platinum: "*p5..p1",
  diamond: "*d5..d1",
  ruby: "*r5..r1",
};

// tier별 문제목록 캐시(너무 자주 호출하지 않기 위해)
const cache = new Map(); // tier -> { ts, items }
const CACHE_MS = 60_000;

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function fetchProblems(tier) {
  const size = 80;
  const query = TIER_QUERY[tier];

  const url = new URL("https://solved.ac/api/v3/search/problem");
  url.searchParams.set("query", query);
  url.searchParams.set("page", "1");
  url.searchParams.set("size", String(size));

  const res = await fetch(url, {
    headers: { "User-Agent": "baekjoon-random/1.0" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`solved.ac error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.items ?? [];
}

// ✅ API: /api/random?tier=gold
app.get("/api/random", async (req, res) => {
  try {
    const tier = String(req.query.tier || "").toLowerCase();

    if (!TIER_QUERY[tier]) {
      return res.status(400).json({ error: "tier invalid" });
    }

    const now = Date.now();
    const cached = cache.get(tier);

    let items;
    if (cached && now - cached.ts < CACHE_MS) {
      items = cached.items;
    } else {
      items = await fetchProblems(tier);
      cache.set(tier, { ts: now, items });
    }

    if (!items.length) {
      return res.status(404).json({ error: "no problems found" });
    }

    const p = pickRandom(items);

    return res.json({
      problemId: p.problemId,
      title: p.titleKo ?? p.title ?? "",
      url: `https://www.acmicpc.net/problem/${p.problemId}`,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || "server error" });
  }
});

app.get("/", (req, res) => {
  res.send("API server is running");
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("listening", PORT));
