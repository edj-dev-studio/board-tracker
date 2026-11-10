import { redirect } from "next/navigation";

// 로컬 전용 앱이라 로그인 없이 대시보드로 바로 이동한다
export default function Home() {
  redirect("/dashboard");
}
