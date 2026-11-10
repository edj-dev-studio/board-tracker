"use client";

import { useState, useEffect, useCallback } from "react";

interface CompanyMap {
  [name: string]: string;
}

interface CacheEntry {
  id: number;
  corp_name: string;
  stock_code: string;
  year: number;
  directors: { name: string; position: string }[];
  cached_at: string;
}

type AdminTab = "companies" | "cache";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("companies");

  // Company management state
  const [companies, setCompanies] = useState<CompanyMap>({});
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Cache management state
  const [caches, setCaches] = useState<CacheEntry[]>([]);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [cacheMessage, setCacheMessage] = useState("");
  const [cacheDeleting, setCacheDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<
    "selected" | "all" | null
  >(null);

  // Load companies on mount
  useEffect(() => {
    fetch("/api/companies")
      .then((res) => res.json())
      .then((data) => setCompanies(data.companies))
      .catch(() => setMessage("회사 목록을 불러오는데 실패했습니다."))
      .finally(() => setLoading(false));
  }, []);

  // Load cache list
  const loadCaches = useCallback(async () => {
    setCacheLoading(true);
    setCacheMessage("");
    try {
      const res = await fetch("/api/cache");
      const data = await res.json();
      if (data.caches) {
        setCaches(data.caches);
      } else {
        setCacheMessage(data.error || "캐시 목록을 불러오는데 실패했습니다.");
      }
    } catch {
      setCacheMessage("서버 오류");
    } finally {
      setCacheLoading(false);
    }
  }, []);

  // Load caches when switching to cache tab
  useEffect(() => {
    if (activeTab === "cache") {
      loadCaches();
    }
  }, [activeTab, loadCaches]);

  // --- Company handlers ---
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) return;

    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          name: newName.trim(),
          stockCode: newCode.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCompanies(data.companies);
        setNewName("");
        setNewCode("");
        setMessage(`${newName.trim()} 추가 완료`);
      } else {
        setMessage(data.error || "추가 실패");
      }
    } catch {
      setMessage("서버 오류");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(name: string) {
    if (!confirm(`"${name}"을(를) 삭제하시겠습니까?`)) return;

    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", name }),
      });

      const data = await res.json();
      if (data.success) {
        setCompanies(data.companies);
        setMessage(`${name} 삭제 완료`);
      } else {
        setMessage(data.error || "삭제 실패");
      }
    } catch {
      setMessage("서버 오류");
    } finally {
      setSaving(false);
    }
  }

  // --- Cache handlers ---
  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === caches.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(caches.map((c) => c.id)));
    }
  }

  async function handleCacheDelete() {
    if (!showDeleteConfirm) return;

    setCacheDeleting(true);
    setCacheMessage("");

    try {
      const body =
        showDeleteConfirm === "all"
          ? { action: "deleteAll" }
          : { action: "delete", ids: Array.from(selectedIds) };

      const res = await fetch("/api/cache", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setCacheMessage(
          `${data.deleted}건의 캐시 데이터가 삭제되었습니다.`
        );
        setSelectedIds(new Set());
        await loadCaches();
      } else {
        setCacheMessage(data.error || "삭제 실패");
      }
    } catch {
      setCacheMessage("서버 오류");
    } finally {
      setCacheDeleting(false);
      setShowDeleteConfirm(null);
    }
  }

  // --- Company sort ---
  const pinnedOrder = ["SK텔레콤", "SK Inc.", "SK스퀘어", "SK하이닉스"];

  const sortedEntries = Object.entries(companies)
    .filter(
      ([name]) =>
        !searchQuery || name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort(([a], [b]) => {
      const aPin = pinnedOrder.indexOf(a);
      const bPin = pinnedOrder.indexOf(b);
      if (aPin !== -1 && bPin !== -1) return aPin - bPin;
      if (aPin !== -1) return -1;
      if (bPin !== -1) return 1;
      const aSK = a.startsWith("SK");
      const bSK = b.startsWith("SK");
      if (aSK && !bSK) return -1;
      if (!aSK && bSK) return 1;
      return a.localeCompare(b, "ko");
    });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F9F9FB]">
        <div className="text-center animate-pulse">
          <div className="w-8 h-8 border-2 border-[#4B6BFB] border-t-transparent rounded-full mx-auto mb-3 animate-spin" />
          <p className="text-[#8A8A9A] text-sm">
            로딩 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#F9F9FB] py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#1A1A1A] md:text-2xl text-xl">관리자</h1>
          <a
            href="/dashboard"
            className="px-4 py-2 text-[#8A8A9A] bg-white border border-[#ECECEC] rounded-xl hover:bg-[#F9F9FB] transition text-sm min-h-[44px] flex items-center"
          >
            대시보드로
          </a>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#ECECEC] mb-6">
          <button
            onClick={() => setActiveTab("companies")}
            className={`px-6 py-3 text-sm font-medium transition min-h-[44px] ${
              activeTab === "companies"
                ? "text-[#4B6BFB] border-b-2 border-[#4B6BFB]"
                : "text-[#8A8A9A] hover:text-[#1A1A1A]"
            }`}
          >
            회사 관리
          </button>
          <button
            onClick={() => setActiveTab("cache")}
            className={`px-6 py-3 text-sm font-medium transition min-h-[44px] ${
              activeTab === "cache"
                ? "text-[#4B6BFB] border-b-2 border-[#4B6BFB]"
                : "text-[#8A8A9A] hover:text-[#1A1A1A]"
            }`}
          >
            캐시 관리
          </button>
        </div>

        {/* ========== Companies Tab ========== */}
        {activeTab === "companies" && (
          <>
            <p className="text-[#8A8A9A] text-sm mb-4">
              총 {Object.keys(companies).length}개 회사
            </p>

            {message && (
              <div className="bg-[#EEF1FF] text-[#4B6BFB] px-4 py-2 rounded-xl text-sm mb-4 border border-[#4B6BFB]/20">
                {message}
              </div>
            )}

            {/* Add Company Form */}
            <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#ECECEC] p-6 mb-4">
              <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">
                회사 추가
              </h2>
              <form onSubmit={handleAdd} className="flex gap-3 items-end flex-wrap">
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-sm text-[#8A8A9A] mb-1">
                    회사명
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="예: 삼성전자"
                    className="w-full px-3 py-2 border border-[#ECECEC] rounded-xl text-[#1A1A1A] bg-[#F3F3F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4B6BFB] focus:border-[#4B6BFB] min-h-[44px] transition"
                  />
                </div>
                <div className="w-40">
                  <label className="block text-sm text-[#8A8A9A] mb-1">
                    종목코드
                  </label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="예: 005930"
                    className="w-full px-3 py-2 border border-[#ECECEC] rounded-xl text-[#1A1A1A] bg-[#F3F3F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4B6BFB] focus:border-[#4B6BFB] min-h-[44px] transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving || !newName.trim() || !newCode.trim()}
                  className="px-6 py-2 bg-[#4B6BFB] text-white rounded-xl hover:bg-[#3A5AEA] disabled:opacity-50 transition min-h-[44px]"
                >
                  추가
                </button>
              </form>
            </div>

            {/* Company List */}
            <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#ECECEC] overflow-hidden">
              <div className="p-4 border-b border-[#ECECEC]">
                <input
                  type="text"
                  placeholder="회사명 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-[#ECECEC] rounded-xl text-sm text-[#1A1A1A] bg-[#F3F3F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4B6BFB] focus:border-[#4B6BFB] min-h-[44px] transition"
                />
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#F3F3F6] sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-3 text-[#8A8A9A] font-medium border-b border-[#ECECEC]">
                        회사명
                      </th>
                      <th className="text-left px-4 py-3 text-[#8A8A9A] font-medium border-b border-[#ECECEC]">
                        종목코드
                      </th>
                      <th className="text-right px-4 py-3 text-[#8A8A9A] font-medium border-b border-[#ECECEC]">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEntries.map(([name, code]) => (
                      <tr
                        key={name}
                        className="border-t border-[#ECECEC] hover:bg-[#F9F9FB] transition"
                      >
                        <td className="px-4 py-2.5 text-[#1A1A1A]">{name}</td>
                        <td className="px-4 py-2.5 text-[#8A8A9A] font-mono">
                          {code}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => handleDelete(name)}
                            disabled={saving}
                            className="text-red-400 hover:text-red-600 text-sm disabled:opacity-50 min-h-[44px] px-2"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ========== Cache Tab ========== */}
        {activeTab === "cache" && (
          <>
            {cacheMessage && (
              <div className="bg-[#EEF1FF] text-[#4B6BFB] px-4 py-2 rounded-xl text-sm mb-4 border border-[#4B6BFB]/20">
                {cacheMessage}
              </div>
            )}

            {cacheLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center animate-pulse">
                  <div className="w-8 h-8 border-2 border-[#4B6BFB] border-t-transparent rounded-full mx-auto mb-3 animate-spin" />
                  <p className="text-[#8A8A9A] text-sm">캐시 목록 로딩 중...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Action Bar */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <p className="text-[#8A8A9A] text-sm">
                    총 {caches.length}건의 캐시 데이터
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm("selected")}
                      disabled={selectedIds.size === 0 || cacheDeleting}
                      className="px-4 py-2 text-red-500 bg-white border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-50 transition text-sm min-h-[44px]"
                    >
                      선택 삭제 ({selectedIds.size}건)
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm("all")}
                      disabled={caches.length === 0 || cacheDeleting}
                      className="px-4 py-2 text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-50 transition text-sm min-h-[44px]"
                    >
                      전체 삭제
                    </button>
                  </div>
                </div>

                {/* Cache Table */}
                {caches.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#ECECEC] p-12 text-center">
                    <p className="text-[#8A8A9A]">
                      저장된 캐시 데이터가 없습니다.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#ECECEC] overflow-hidden">
                    <div className="max-h-[600px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-[#F3F3F6] sticky top-0">
                          <tr>
                            <th className="px-4 py-3 w-10 border-b border-[#ECECEC]">
                              <input
                                type="checkbox"
                                checked={
                                  caches.length > 0 &&
                                  selectedIds.size === caches.length
                                }
                                onChange={toggleSelectAll}
                                className="rounded border-[#ECECEC] accent-[#4B6BFB]"
                              />
                            </th>
                            <th className="text-left px-4 py-3 text-[#8A8A9A] font-medium border-b border-[#ECECEC]">
                              회사명
                            </th>
                            <th className="text-left px-4 py-3 text-[#8A8A9A] font-medium border-b border-[#ECECEC]">
                              연도
                            </th>
                            <th className="text-left px-4 py-3 text-[#8A8A9A] font-medium border-b border-[#ECECEC]">
                              이사 수
                            </th>
                            <th className="text-left px-4 py-3 text-[#8A8A9A] font-medium border-b border-[#ECECEC]">
                              저장 시점
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {caches.map((cache) => (
                            <tr
                              key={cache.id}
                              className="border-t border-[#ECECEC] hover:bg-[#F9F9FB] transition"
                            >
                              <td className="px-4 py-2.5">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(cache.id)}
                                  onChange={() => toggleSelect(cache.id)}
                                  className="rounded border-[#ECECEC] accent-[#4B6BFB]"
                                />
                              </td>
                              <td className="px-4 py-2.5 text-[#1A1A1A]">
                                {cache.corp_name}
                              </td>
                              <td className="px-4 py-2.5 text-[#8A8A9A]">
                                {cache.year}
                              </td>
                              <td className="px-4 py-2.5 text-[#8A8A9A]">
                                {cache.directors.length}명
                              </td>
                              <td className="px-4 py-2.5 text-[#8A8A9A] text-xs">
                                {new Date(cache.cached_at).toLocaleString(
                                  "ko-KR"
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[#ECECEC] p-6 max-w-md w-full">
              <h3 className="text-base font-semibold text-[#1A1A1A] mb-3">
                캐시 데이터 삭제
              </h3>
              <p className="text-[#8A8A9A] text-sm mb-6">
                {showDeleteConfirm === "all"
                  ? "저장된 모든 캐시 데이터를 삭제하시겠습니까? 삭제된 데이터는 다음 조회 시 DART API와 LLM을 통해 다시 수집됩니다."
                  : `선택하신 ${selectedIds.size}건의 캐시 데이터를 삭제하시겠습니까? 삭제된 데이터는 다음 조회 시 DART API와 LLM을 통해 다시 수집됩니다.`}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  disabled={cacheDeleting}
                  className="px-4 py-2 text-[#8A8A9A] bg-white border border-[#ECECEC] rounded-xl hover:bg-[#F9F9FB] transition text-sm min-h-[44px]"
                >
                  취소
                </button>
                <button
                  onClick={handleCacheDelete}
                  disabled={cacheDeleting}
                  className="px-4 py-2 text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-50 transition text-sm min-h-[44px]"
                >
                  {cacheDeleting ? "삭제 중..." : "삭제"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
