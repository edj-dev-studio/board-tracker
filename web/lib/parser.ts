import { load } from "cheerio";
import type { Node as DomNode, Element, Text } from "domhandler";

/**
 * DART 보고서 HTML에서 "1. 이사회에 관한 사항" 섹션을 찾아
 * 그 이후 텍스트를 약 5000자 수집합니다.
 *
 * Python 원본(BeautifulSoup find_all_next(string=True))과 동일한 동작:
 * - <TITLE>, <title>, <span>, <p>, <b> 태그에서 키워드를 찾고
 * - 해당 태그 이후의 모든 텍스트 노드를 문서 순서대로 수집
 */
export function extractBoardSection(htmlContent: string): string {
  // cheerio의 HTML 파서는 <TITLE>을 <head>의 <title>로 처리하므로
  // xmlMode를 사용하여 커스텀 태그를 그대로 보존
  const $ = load(htmlContent, { xml: true });

  // 1. 본문 섹션 제목 <TITLE ATOC="Y">"1. 이사회에 관한 사항"을 먼저 찾는다.
  //    목차 문단에도 같은 문구("가. 이사회 구성 개요" 등)가 있어서,
  //    키워드로만 찾으면 목차를 본문으로 잘못 잡는 보고서가 있다(예: 효성).
  let targetNode: DomNode | null = null;

  $("TITLE").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if ($(el).attr("ATOC") === "Y" && /^1\. 이사회에 관한 사항/.test(text)) {
      targetNode = el as DomNode;
      return false; // break
    }
  });

  // 2. 없으면 키워드를 포함하는 첫 태그를 찾는다
  //    DART HTML은 <TITLE ATOC="Y">, <title>, <span>, <p>, <b> 등을 사용
  if (!targetNode) {
    $("TITLE, title, SPAN, span, P, p, B, b").each((_, el) => {
      const text = $(el).text().trim();
      if (
        text.includes("1. 이사회에 관한 사항") ||
        text.includes("이사회 구성 개요")
      ) {
        targetNode = el as DomNode;
        return false; // break
      }
    });
  }

  if (!targetNode) {
    // 폴백: 전체 텍스트 앞부분 반환
    return $.text().substring(0, 12000);
  }

  // 3. 해당 노드 이후의 모든 텍스트 노드를 문서 순서대로 수집
  //    (Python의 find_all_next(string=True) 동작 재현)
  const allNodes: DomNode[] = [];
  collectAllNodes($.root()[0] as DomNode, allNodes);

  // targetNode의 위치를 찾는다
  const targetIndex = allNodes.indexOf(targetNode as DomNode);
  if (targetIndex === -1) {
    return $.text().substring(0, 12000);
  }

  // targetNode 이후의 텍스트 노드만 수집
  const contentParts: string[] = [];
  for (let i = targetIndex + 1; i < allNodes.length; i++) {
    const node = allNodes[i];
    if (node.type === "text") {
      const text = (node as Text).data?.trim();
      if (text) {
        contentParts.push(text);
      }
    }

    // 약 5000자 초과하면 중단
    if (contentParts.join(" ").length > 5000) {
      break;
    }
  }

  if (contentParts.length === 0) {
    return $.text().substring(0, 12000);
  }

  return contentParts.join("\n");
}

/** DOM 트리를 깊이 우선으로 순회하여 모든 노드를 배열에 담는다 */
function collectAllNodes(node: DomNode, result: DomNode[]): void {
  result.push(node);
  const children = (node as Element).children;
  if (children) {
    for (const child of children) {
      collectAllNodes(child as DomNode, result);
    }
  }
}
