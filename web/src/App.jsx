import { useState } from "react";
import "./App.css";

export default function App() {
  const [tier, setTier] = useState("gold");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_BASE = "https://baekjoon-random-api.onrender.com";

  async function drawProblem() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/random?tier=${tier}`);

      // 서버가 에러를 JSON으로 줄 수도 있어서 처리
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = data?.error || `요청 실패 (status ${res.status})`;
        throw new Error(msg);
      }

      setResult({
        problemId: data.problemId,
        url: data.url,
      });
    } catch (e) {
      alert(e.message || "Failed to fetch");
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
