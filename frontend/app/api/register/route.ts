import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { signAccessToken } from "@/lib/auth";

type RegisterBody = {
    name?: string;
    email?: string;
    password?: string;
    brand_name: string,
    business_type: string,
    description: string,
    target: string,
    tone_brand: string,
    ci_color: string,
    market_goal: string,
};

export async function POST(req: Request) {
    try {
        const { email, password, name, brand_name, business_type, description, target, tone_brand, ci_color, market_goal } = (await req.json()) as RegisterBody;

        if (!email || !password) {
        return NextResponse.json(
            { message: "Email and password are required" },
            { status: 400 }
        );
        }

        if (password.length < 6) {
        return NextResponse.json(
            { message: "Password must be at least 6 characters" },
            { status: 400 }
        );
        }

        const { data: existingUser, error: findError } = await supabase
        .from("users")
        .select("user_id")
        .eq("email", email)
        .maybeSingle();

        if (findError) {
        return NextResponse.json(
            { message: "Failed to check existing user", error: findError.message },
            { status: 500 }
        );
        }

        if (existingUser) {
        return NextResponse.json(
            { message: "Email already exists" },
            { status: 409 }
        );
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
            full_name: name,
            email,
            password_hash: passwordHash,
            brand_name: brand_name,
            business_type: business_type,
            description: description,
            target: target,
            tone_brand: tone_brand,
            ci_color: ci_color,
            market_goal: market_goal,
        })
        .select("user_id, full_name, email, created_at")
        .single();

        if (insertError || !newUser) {
        return NextResponse.json(
            { message: "Failed to create user", error: insertError?.message },
            { status: 500 }
        );
        }

        const accessToken = signAccessToken({
        userId: newUser.user_id,
        email: newUser.email,
        role: "user",
        });

        const response = NextResponse.json(
        {
            message: "Register success",
            user: newUser,
        },
        { status: 201 }
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
        console.error("REGISTER_ERROR:", error);

        return NextResponse.json(
        { message: "Internal server error" },
        { status: 500 }
        );
    }
}