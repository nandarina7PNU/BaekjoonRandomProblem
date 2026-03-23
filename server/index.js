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

const TIER_SYMBOL = {
  bronze: "b",
  silver: "s",
  gold: "g",
  platinum: "p",
  diamond: "d",
  ruby: "r",
};

// 조건별 문제목록 캐시(너무 자주 호출하지 않기 위해)
const cache = new Map(); // query -> { ts, items }
const CACHE_MS = 60_000;

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildTierQuery(tier, step) {
  const symbol = TIER_SYMBOL[tier];
  if (!symbol) {
    return null;
  }

  if (step === undefined) {
    return `*${symbol}5..${symbol}1`;
  }

  const parsedStep = Number.parseInt(String(step), 10);
  if (Number.isNaN(parsedStep) || parsedStep < 1 || parsedStep > 5) {
    return null;
  }

  return `*${symbol}${parsedStep}`;
}

async function fetchProblems(query) {
  const size = 80;

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

// ✅ API:
// /api/random?tier=gold
// /api/random?tier=gold&step=3
app.get("/api/random", async (req, res) => {
  try {
    const tier = String(req.query.tier || "").toLowerCase();
    const step = req.query.step;

    const query = buildTierQuery(tier, step);
    if (!query) {
      return res.status(400).json({ error: "tier or step invalid" });
    }

    const now = Date.now();
    const cached = cache.get(query);

    let items;
    if (cached && now - cached.ts < CACHE_MS) {
      items = cached.items;
    } else {
      items = await fetchProblems(query);
      cache.set(query, { ts: now, items });
    }

    if (!items.length) {
      return res.status(404).json({ error: "no problems found" });
    }

    const p = pickRandom(items);

    return res.json({
      problemId: p.problemId,
      title: p.titleKo ?? p.title ?? "",
      url: `https://www.acmicpc.net/problem/${p.problemId}`,
      query,
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
