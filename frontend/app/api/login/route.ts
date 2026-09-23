import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase-admin";
import { signAccessToken } from "@/lib/auth";

// Service-role client: this route reads password_hash to authenticate the
// request, so it must never rely on the public anon key — RLS can't
// distinguish "logging in" from any other anonymous caller.
const supabase = createAdminClient();

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) as {
      email?: string;
      password?: string;
    };

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

    if (error) {
      // Never echo DB error details to the client — they can leak schema
      // and query structure. Full detail goes to server logs only, and
      // never includes the row itself (it has password_hash on it).
      console.error("LOGIN_QUERY_ERROR:", error.message);
      return NextResponse.json(
        { message: "Something went wrong, please try again" },
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
      console.error(`User ${user.user_id} has no valid password_hash set`);
      return NextResponse.json(
        { message: "User password is not set correctly" },
        { status: 500 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

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
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}