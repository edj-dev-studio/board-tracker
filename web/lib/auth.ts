import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-change-me"
);

export type Role = "user" | "admin";

interface SessionPayload extends JWTPayload {
  role: Role;
}

export async function createSession(role: Role): Promise<string> {
  const token = await new SignJWT({ role } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
  return token;
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return verifySession(token);
}

export function validateAccessCode(code: string): Role | null {
  const accessCode = process.env.ACCESS_CODE || "sk2026";
  const adminCode = process.env.ADMIN_CODE || "sk2026_admin";

  if (code === adminCode) return "admin";
  if (code === accessCode) return "user";
  return null;
}
