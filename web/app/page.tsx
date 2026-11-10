"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "인증에 실패했습니다.");
        return;
      }

      if (data.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("서버와 통신할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-[#F9F9FB]">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] border border-[#ECECEC] p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">
              Board Tracker
            </h1>
            <p className="text-[#8A8A9A] text-sm">
              상장사 이사회 구성원 조회 서비스
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-[#1A1A1A] mb-1"
              >
                접속 코드
              </label>
              <input
                id="code"
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="접속 코드를 입력하세요"
                className="w-full px-4 py-3 border border-[#ECECEC] rounded-xl bg-[#F3F3F6] focus:bg-white focus:ring-2 focus:ring-[#4B6BFB] focus:border-[#4B6BFB] outline-none transition text-[#1A1A1A] text-base"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !code}
              className="w-full py-3 bg-[#4B6BFB] text-white font-medium rounded-xl hover:bg-[#3A5AEA] disabled:opacity-50 disabled:cursor-not-allowed transition min-h-[44px]"
            >
              {loading ? "확인 중..." : "입장"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
