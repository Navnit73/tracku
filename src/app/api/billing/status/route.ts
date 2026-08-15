import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth";
import { getUserTransactionUsage } from "@/lib/subscription";

export async function GET() {
  try {
    const user = await requireAuthUser();
    const usage = await getUserTransactionUsage(user.id);

    return NextResponse.json({
      success: true,
      ...usage,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to retrieve billing status.",
      },
      { status: 500 }
    );
  }
}
