import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getCacheList,
  deleteCacheEntries,
  deleteAllCache,
} from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const caches = await getCacheList();
    return NextResponse.json({ caches });
  } catch (error) {
    console.error("Cache list error:", error);
    return NextResponse.json(
      { error: "캐시 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, ids } = body;

    let deleted = 0;
    if (action === "deleteAll") {
      deleted = await deleteAllCache();
    } else if (action === "delete" && Array.isArray(ids)) {
      deleted = await deleteCacheEntries(ids);
    } else {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error("Cache delete error:", error);
    return NextResponse.json(
      { error: "캐시 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
