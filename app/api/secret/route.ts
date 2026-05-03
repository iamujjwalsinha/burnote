import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { storeSecret } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ciphertext, iv, burnOnRead, ttl } = body;

    if (
      !ciphertext ||
      !iv ||
      typeof ciphertext !== "string" ||
      typeof iv !== "string" ||
      ciphertext.trim() === "" ||
      iv.trim() === ""
    ) {
      return NextResponse.json(
        { error: "Invalid request: ciphertext and iv are required" },
        { status: 400 }
      );
    }

    const ttlSeconds = typeof ttl === "number" && ttl > 0 ? ttl : 86400;
    const id = nanoid(10);

    await storeSecret(
      id,
      {
        ciphertext,
        iv,
        burnOnRead: Boolean(burnOnRead),
        createdAt: Date.now(),
      },
      ttlSeconds
    );

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Error storing secret:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
