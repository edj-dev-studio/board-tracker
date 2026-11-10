"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

interface CompanyMap {
  [name: string]: string;
}

const pinnedOrder = ["SK텔레콤", "SK Inc.", "SK스퀘어", "SK하이닉스"];

function sortCompanies(companies: CompanyMap): [string, string][] {
  const entries = Object.entries(companies);

  return entries.sort(([a], [b]) => {
    const aPin = pinnedOrder.indexOf(a);
    const bPin = pinnedOrder.indexOf(b);
    // Pinned companies first, in order
    if (aPin !== -1 && bPin !== -1) return aPin - bPin;
    if (aPin !== -1) return -1;
    if (bPin !== -1) return 1;

    // Then other SK companies
    const aIsSK = a.toUpperCase().startsWith("SK");
    const bIsSK = b.toUpperCase().startsWith("SK");
    if (aIsSK && !bIsSK) return -1;
    if (!aIsSK && bIsSK) return 1;

    // Within same group: ABC first, then 가나다
    const aIsAlpha = /^[A-Za-z]/.test(a);
    const bIsAlpha = /^[A-Za-z]/.test(b);
    if (aIsAlpha && !bIsAlpha) return -1;
    if (!aIsAlpha && bIsAlpha) return 1;

    return a.localeCompare(b, "ko");
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyMap>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [startYear, setStartYear] = useState(2022);
  const [endYear, setEndYear] = useState(2025);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 2014 },
    (_, i) => 2015 + i
  );

  useEffect(() => {
    fetch("/api/companies")
      .then((res) => res.json())
      .then((data) => setCompanies(data.companies))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sortedCompanies = useMemo(
    () => sortCompanies(companies),
    [companies]
  );

  const filteredCompanies = useMemo(() => {
    if (!searchQuery) return sortedCompanies;
    const q = searchQuery.toLowerCase();
    return sortedCompanies.filter(([name]) =>
      name.toLowerCase().includes(q)
    );
  }, [sortedCompanies, searchQuery]);

  function toggleCompany(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else if (next.size < 5) {
        next.add(name);
      }
      return next;
    });
  }

  function handleSubmit() {
    if (selected.size === 0) return;
    if (startYear > endYear) return;

    const params = new URLSearchParams();
    const selectedEntries = Array.from(selected).map((name) => ({
      name,
      stockCode: companies[name],
    }));
    params.set("companies", JSON.stringify(selectedEntries));
    params.set("startYear", String(startYear));
    params.set("endYear", String(endYear));

    router.push(`/results?${params.toString()}`);
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F9F9FB]">
        {/* Skeleton UI */}
        <div className="w-full max-w-5xl mx-auto px-4 animate-pulse">
          <div className="h-8 bg-[#ECECEC] rounded w-48 mb-2" />
          <div className="h-4 bg-[#ECECEC] rounded w-72 mb-8" />
          <div className="bg-white rounded-xl border border-[#ECECEC] p-6 mb-4">
            <div className="h-5 bg-[#ECECEC] rounded w-24 mb-4" />
            <div className="flex gap-4">
              <div className="h-10 bg-[#ECECEC] rounded w-28" />
              <div className="h-10 bg-[#ECECEC] rounded w-28" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#ECECEC] p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-9 bg-[#F3F3F6] rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#F9F9FB] py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] md:text-2xl text-xl">
              이사회 구성원 조회
            </h1>
            <p className="text-[#8A8A9A] text-sm mt-1">
              조회할 회사를 선택하고 연도 범위를 지정하세요 (최대 5개)
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin"
              className="px-4 py-2 text-[#8A8A9A] bg-white border border-[#ECECEC] rounded-xl hover:bg-[#F9F9FB] transition text-sm min-h-[44px] flex items-center"
            >
              관리자
            </a>
          </div>
        </div>

        {/* Year Range */}
        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#ECECEC] p-6 mb-4">
          <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">
            조회 기간
          </h2>
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className="block text-sm text-[#8A8A9A] mb-1">
                시작연도
              </label>
              <select
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
                className="px-3 py-2 border border-[#ECECEC] rounded-xl text-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#4B6BFB] focus:border-[#4B6BFB] min-h-[44px]"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}년
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[#8A8A9A] mt-6">~</span>
            <div>
              <label className="block text-sm text-[#8A8A9A] mb-1">
                끝연도
              </label>
              <select
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}
                className="px-3 py-2 border border-[#ECECEC] rounded-xl text-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#4B6BFB] focus:border-[#4B6BFB] min-h-[44px]"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}년
                  </option>
                ))}
              </select>
            </div>
          </div>
          {startYear > endYear && (
            <p className="text-red-500 text-sm mt-2">
              시작연도가 끝연도보다 클 수 없습니다.
            </p>
          )}
        </div>

        {/* Company Selection */}
        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#ECECEC] p-6 mb-4">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="text-base font-semibold text-[#1A1A1A]">
              회사 선택
              <span className="ml-2 text-sm font-normal text-[#8A8A9A]">
                ({selected.size}/5)
              </span>
            </h2>
            <input
              type="text"
              placeholder="회사명 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 border border-[#ECECEC] rounded-xl text-sm w-48 text-[#1A1A1A] bg-[#F3F3F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4B6BFB] focus:border-[#4B6BFB] min-h-[44px] transition"
            />
          </div>

          {selected.size > 0 && (
            <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-[#ECECEC]">
              {Array.from(selected).map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[#EEF1FF] text-[#4B6BFB] rounded-full text-sm font-medium"
                >
                  {name}
                  <button
                    onClick={() => toggleCompany(name)}
                    className="hover:text-[#3A5AEA] min-w-[20px] min-h-[20px]"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
            {filteredCompanies.map(([name]) => {
              const isSelected = selected.has(name);
              const isDisabled = !isSelected && selected.size >= 5;

              return (
                <label
                  key={name}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition text-sm min-h-[44px] ${
                    isSelected
                      ? "bg-[#EEF1FF] text-[#4B6BFB] font-medium"
                      : isDisabled
                      ? "text-[#ECECEC] cursor-not-allowed"
                      : "text-[#1A1A1A] hover:bg-[#F3F3F6]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => toggleCompany(name)}
                    className="rounded border-[#ECECEC] accent-[#4B6BFB]"
                  />
                  <span className="truncate">{name}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Submit Button - full width on mobile */}
        <button
          onClick={handleSubmit}
          disabled={selected.size === 0 || startYear > endYear}
          className="w-full md:w-auto md:float-right px-8 py-3 bg-[#4B6BFB] text-white font-medium rounded-xl hover:bg-[#3A5AEA] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-[0_2px_8px_rgba(75,107,251,0.3)] min-h-[44px]"
        >
          조회하기
        </button>
      </div>
    </div>
  );
}
