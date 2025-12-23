import express from "express";

const app = express();
const PORT = 3000;

// 티어 -> solved.ac level 범위(브5~루1: 1~30)
const TIER_TO_LEVEL_RANGE = {
  bronze: [1, 5],
  silver: [6, 10],
  gold: [11, 15],
  platinum: [16, 20],
  diamond: [21, 25],
  ruby: [26, 30],
};

// tier별 문제목록 캐시(너무 자주 호출하지 않기 위해)
const cache = new Map(); // tier -> { ts, items }
const CACHE_MS = 60_000;

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function fetchProblems(tier) {
  const [minL, maxL] = TIER_TO_LEVEL_RANGE[tier];
  const size = 80;

  // ✅ 핵심: tier 범위 검색 쿼리
  const query = `level:${minL}..${maxL}`;

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
    if (!TIER_TO_LEVEL_RANGE[tier]) {
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

app.listen(PORT, () => {
  console.log(`API Server: http://localhost:${PORT}`);
});
