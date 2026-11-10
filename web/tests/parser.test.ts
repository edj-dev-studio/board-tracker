import { test } from "node:test";
import assert from "node:assert/strict";
import { extractBoardSection } from "../lib/parser.ts";

// 효성 반기보고서 구조를 줄인 것: 목차 문단에 "가. 이사회 구성 개요"가 먼저 나온다
const TOC_FIRST_HTML = `<?xml version="1.0" encoding="utf-8"?>
<DOCUMENT><BODY>
<P>1. 요약재무정보 ........ 74&cr;Ⅵ. 이사회 등 회사의 기관에 관한 사항 ........ 251&cr;   1.  이사회에 관한 사항 ........ 251&cr;     가. 이사회 구성 개요&cr;     나. 이사회 중요의결사항</P>
<SECTION-1><TITLE ATOC="Y">Ⅵ. 이사회 등 회사의 기관에 관한 사항</TITLE>
<SECTION-2><TITLE ATOC="Y" AASSOCNOTE="D-0-6-1-0">1. 이사회에 관한 사항</TITLE>
<P><SPAN USERMARK=" B">가. 이사회 구성 개요&cr;</SPAN></P>
<P>당사 이사회는 사내이사 4인, 사외이사 6인, 총 10인의 이사로 구성되어 있습니다.</P>
</SECTION-2></SECTION-1>
</BODY></DOCUMENT>`;

test("목차에 '이사회 구성 개요'가 먼저 나와도 본문 섹션 제목부터 잘라낸다", () => {
  const section = extractBoardSection(TOC_FIRST_HTML);
  assert.match(section, /^1\. 이사회에 관한 사항/);
  assert.match(section, /사내이사 4인, 사외이사 6인/);
  assert.doesNotMatch(section, /요약재무정보/);
});

test("ATOC 제목의 띄어쓰기가 달라도 찾는다", () => {
  const html = TOC_FIRST_HTML.replace(
    "<TITLE ATOC=\"Y\" AASSOCNOTE=\"D-0-6-1-0\">1. 이사회에 관한 사항</TITLE>",
    "<TITLE ATOC=\"Y\">1.  이사회에  관한 사항</TITLE>"
  );
  const section = extractBoardSection(html);
  assert.match(section, /^1\.\s+이사회에\s+관한 사항/);
  assert.doesNotMatch(section, /요약재무정보/);
});

test("ATOC 제목이 없으면 기존처럼 키워드가 든 첫 요소부터 잘라낸다", () => {
  const html = `<DOCUMENT><BODY>
<P>머리말</P>
<P>1. 이사회에 관한 사항</P>
<P>당사 이사회는 사내이사 2인으로 구성되어 있습니다.</P>
</BODY></DOCUMENT>`;
  const section = extractBoardSection(html);
  assert.match(section, /^1\. 이사회에 관한 사항/);
  assert.match(section, /사내이사 2인/);
  assert.doesNotMatch(section, /머리말/);
});
