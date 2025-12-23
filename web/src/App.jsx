import { useState } from "react";
import "./App.css";

export default function App() {
  const [tier, setTier] = useState("silver");
  const [result, setResult] = useState({
    url: "https://www.acmicpc.net/problem/1002",
  });
  const [loading, setLoading] = useState(false);

  async function drawProblem() {
    setLoading(true);
    try {
      const res = await fetch(`/api/random?tier=${tier}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "failed");
      setResult(data); // {problemId,title,url}
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h1 className="title">백준 티어별 무작위 문제 뽑기</h1>

      <div className="center">
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

        <div className="result">
          <div className="result-row">
            <div className="pill">문제 링크</div>

            <a
              className="link-box"
              href={result?.url}
              target="_blank"
              rel="noreferrer"
              title="백준 문제 열기"
            >
              {result?.url}
            </a>
          </div>

          <div className="hint">누르면 해당 링크로 이동합니다!</div>
        </div>
      </div>
    </div>
  );
}
