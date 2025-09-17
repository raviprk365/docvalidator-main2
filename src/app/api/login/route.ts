import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const user = await request.json();

  (await cookies()).set("doc-validator-user", JSON.stringify(user), {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });
  return NextResponse.json({ success: true });
}

export async function GET() {
  const userCookie = (await cookies()).get("doc-validator-user")?.value;
  if (!userCookie) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ user: JSON.parse(userCookie) });
}
