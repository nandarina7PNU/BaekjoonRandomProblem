import express from "express";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

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

// API: /api/random?tier=gold
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

    res.json({
      problemId: p.problemId,
      title: p.titleKo ?? p.title ?? "",
      url: `https://www.acmicpc.net/problem/${p.problemId}`,
    });
  } catch (e) {
    res.status(500).json({ error: e.message || "server error" });
  }
});

// ✅ React build 결과 서빙
app.use(express.static(path.join(__dirname, "../web/dist")));

// SPA 대응 (새로고침해도 index.html)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../web/dist/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("listening", PORT));