import { useState } from "react";
import "./App.css";

export default function App() {
  const [tier, setTier] = useState("gold");
  const [result, setResult] = useState(null); // ✅ 처음엔 비어있게
  const [loading, setLoading] = useState(false);

  async function drawProblem() {
    setLoading(true);
    try {
      // 티어별 solved.ac 검색쿼리
      const TIER_QUERY = {
        bronze: "*b5..b1",
        silver: "*s5..s1",
        gold: "*g5..g1",
        platinum: "*p5..p1",
        diamond: "*d5..d1",
        ruby: "*r5..r1",
      };

      const query = TIER_QUERY[tier];
      const url = new URL("https://solved.ac/api/v3/search/problem");
      url.searchParams.set("query", query);
      url.searchParams.set("page", "1");
      url.searchParams.set("size", "80");

      const res = await fetch(url.toString(), {
        headers: {
          // solved.ac가 User-Agent 필요할 때 대비
          "User-Agent": "baekjoon-random/1.0",
        },
      });

      if (!res.ok) throw new Error("solved.ac 요청 실패");
      const data = await res.json();

      const items = data.items ?? [];
      if (items.length === 0) throw new Error("해당 티어 문제를 찾지 못했어요");

      const pick = items[Math.floor(Math.random() * items.length)];
      const problemId = pick.problemId;

      setResult({
        problemId,
        url: `https://www.acmicpc.net/problem/${problemId}`,
      });
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="page">
      <div className="container">
        <h1 className="title">백준 티어별 무작위 문제 뽑기</h1>

        <div className="controls">
          <button className="btn-draw" onClick={drawProblem} disabled={loading}>
            {loading ? "뽑는 중..." : "문제 뽑기"}
          </button>

          <div className="select-col">
            <div className="select-label">난이도 선택하기</div>
            <select
              className="select"
              value={tier}
              onChange={(e) => setTier(e.target.value)}
            >
              <option value="bronze">브론즈</option>
              <option value="silver">실버</option>
              <option value="gold">골드</option>
              <option value="platinum">플래티넘</option>
              <option value="diamond">다이아몬드</option>
              <option value="ruby">루비</option>
            </select>
          </div>
        </div>

        {/* ✅ 문제 뽑기 전에는 아예 안 보이게 */}
        {result && (
          <div className="result">
            <div className="result-row">
              <div className="pill">문제 링크</div>

              <a
                className="link-box"
                href={result.url}
                target="_blank"
                rel="noreferrer"
              >
                {result.url}
              </a>
            </div>

            <div className="hint">누르면 해당 링크로 이동합니다!</div>
          </div>
        )}
      </div>
    </div>
  );
}
