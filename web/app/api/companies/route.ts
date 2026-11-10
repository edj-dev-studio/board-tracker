import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getCompanies,
  addCompany,
  deleteCompany,
} from "@/lib/companies";

export async function GET() {
  const companies = await getCompanies();
  return NextResponse.json({ companies });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, name, stockCode } = body;

    if (!action || !name) {
      return NextResponse.json(
        { error: "action and name are required" },
        { status: 400 }
      );
    }

    let companies;

    if (action === "add") {
      if (!stockCode) {
        return NextResponse.json(
          { error: "stockCode is required for add action" },
          { status: 400 }
        );
      }
      companies = await addCompany(name, stockCode);
    } else if (action === "delete") {
      companies = await deleteCompany(name);
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'add' or 'delete'." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, companies });
  } catch (error) {
    console.error("Companies API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "회사 목록 수정 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
