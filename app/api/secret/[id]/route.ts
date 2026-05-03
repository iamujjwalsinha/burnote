import { NextRequest, NextResponse } from "next/server";
import { getSecret, deleteSecret } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const secret = await getSecret(id);

    if (!secret) {
      return NextResponse.json(
        { error: "Secret not found or expired" },
        { status: 404 }
      );
    }

    if (secret.burnOnRead) {
      await deleteSecret(id);
    }

    return NextResponse.json({
      ciphertext: secret.ciphertext,
      iv: secret.iv,
      burnOnRead: secret.burnOnRead,
    });
  } catch (error) {
    console.error("Error retrieving secret:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
