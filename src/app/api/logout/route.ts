import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  // Clear the httpOnly cookie
  (await cookies()).set("doc-validator-user", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
  });

  return NextResponse.json({ success: true });
}
