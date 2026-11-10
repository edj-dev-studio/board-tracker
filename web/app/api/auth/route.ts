import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSession, validateAccessCode } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { code } = body;

  if (!code || typeof code !== "string") {
    return NextResponse.json(
      { error: "접속 코드를 입력해주세요." },
      { status: 400 }
    );
  }

  const role = validateAccessCode(code.trim());
  if (!role) {
    return NextResponse.json(
      { error: "잘못된 접속 코드입니다." },
      { status: 401 }
    );
  }

  const token = await createSession(role);

  const response = NextResponse.json({ role });
  response.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("session");
  return response;
}
