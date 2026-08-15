import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email address." },
        { status: 404 }
      );
    }

    // Generate 6-digit verification OTP
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    user.resetPasswordToken = resetCode;
    user.resetPasswordExpires = expiresAt;
    await user.save();

    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      code: resetCode,
    });

    return NextResponse.json({
      success: true,
      message: "A 6-digit reset code has been sent to your email.",
      devCode: emailResult.devCode,
    });
  } catch (error) {
    console.error("[Forgot Password Error]", error);
    return NextResponse.json(
      { error: "Failed to process password reset request. Please try again." },
      { status: 500 }
    );
  }
}
