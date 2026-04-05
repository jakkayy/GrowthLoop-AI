import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { signAccessToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) as {
      email?: string;
      password?: string;
    };

    console.log("LOGIN_REQUEST email:", email);

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("user_id, full_name, email, password_hash, role")
      .eq("email", email)
      .maybeSingle();

    console.log("LOGIN_QUERY_ERROR:", error);
    console.log("LOGIN_USER:", user);

    if (error) {
      return NextResponse.json(
        { message: "Failed to query user", error: error.message },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.password_hash || typeof user.password_hash !== "string") {
      console.error("password_hash missing or invalid:", user.password_hash);
      return NextResponse.json(
        { message: "User password is not set correctly" },
        { status: 500 }
      );
    }

    console.log("password_hash prefix:", user.password_hash.slice(0, 4));

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    console.log("PASSWORD_MATCH:", passwordMatch);

    if (!passwordMatch) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const role = (user.role ?? "user") as "user" | "admin";

    const accessToken = signAccessToken({
      userId: user.user_id,
      email: user.email,
      role,
    });

    console.log("TOKEN_CREATED");

    const response = NextResponse.json(
      {
        message: "Login success",
        user: {
          user_id: user.user_id,
          full_name: user.full_name,
          email: user.email,
          role,
        },
      },
      { status: 200 }
    );

    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("LOGIN_ERROR:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}