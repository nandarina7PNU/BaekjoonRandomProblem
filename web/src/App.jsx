import { useState } from "react";

export default function App() {
  const [tier, setTier] = useState("gold");
  const [link, setLink] = useState("https://www.acmicpc.net/problem/1002");
  const [loading, setLoading] = useState(false);

  async function drawProblem() {
    setLoading(true);
    try {
      const res = await fetch(`/api/random?tier=${tier}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "failed");
      setLink(data.url); // ✅ 링크 갱신
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>백준 티어별 무작위 문제 뽑기</h1>

      <select value={tier} onChange={(e) => setTier(e.target.value)}>
        <option value="bronze">브론즈</option>
        <option value="silver">실버</option>
        <option value="gold">골드</option>
        <option value="platinum">플래티넘</option>
        <option value="diamond">다이아몬드</option>
        <option value="ruby">루비</option>
      </select>

      <button onClick={drawProblem} disabled={loading}>
        {loading ? "뽑는 중..." : "문제 뽑기"}
      </button>

      <div style={{ marginTop: 20 }}>
        <a href={link} target="_blank" rel="noreferrer">
          {link}
        </a>
      </div>
    </div>
  );
}
