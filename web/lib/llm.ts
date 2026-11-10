import OpenAI from "openai";

interface Director {
  name: string;
  position: string;
}

interface ParseResult {
  directors: Director[];
}

export async function parseDirectors(
  sectionText: string,
  corpName: string,
  year: number
): Promise<ParseResult> {
  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  });

  const prompt = `당신은 기업 지배구조 분석 전문가입니다.
아래는 ${year}년도 ${corpName}의 사업보고서 중 '이사회에 관한 사항' 섹션의 내용입니다.
이 텍스트를 분석하여 ${year}년 당시 이사회의 모든 구성원(사내이사, 사외이사 포함) 명단을 추출하세요.
텍스트 내에 괄호로 나열된 이름들(예: 사내이사 3인(이름1, 이름2...))을 특히 주의 깊게 확인하여 누락 없이 추출하세요.

반드시 아래 JSON 형식으로만 답변하세요. JSON 외에 다른 텍스트를 포함하지 마세요.
{
  "directors": [
    {
      "name": "이사 성명",
      "position": "직위 (사내이사, 사외이사, 대표이사 등)"
    }
  ]
}

보고서 내용:
${sectionText}`;

  const response = await client.chat.completions.create({
    model: "openai/gpt-4.1",
    temperature: 0,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("LLM returned empty response");

  const parsed = JSON.parse(content);
  return parsed as ParseResult;
}
