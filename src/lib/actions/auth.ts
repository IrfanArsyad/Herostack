"use server";

import { signIn, signOut } from "@/lib/auth";
import { db, users } from "@/lib/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import slugify from "slugify";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password must have: 8+ chars, 1 uppercase, 1 lowercase, 1 number
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Password must contain at least one number" };
  }
  return { valid: true };
}

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "All fields are required" };
  }

  // Validate email format
  if (!EMAIL_REGEX.test(email)) {
    return { error: "Please enter a valid email address" };
  }

  // Rate limiting: 5 registration attempts per 15 minutes per email
  const rateLimitKey = `register:${email.toLowerCase()}`;
  const rateLimit = checkRateLimit(rateLimitKey, { maxAttempts: 5, windowMs: 15 * 60 * 1000 });
  if (!rateLimit.success) {
    return { error: `Too many registration attempts. Please try again in ${Math.ceil(rateLimit.resetIn / 60)} minutes.` };
  }

  // Validate password complexity
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return { error: passwordValidation.error };
  }

  try {
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return { error: "User with this email already exists" };
    }

    // Check if this is the first user (will be admin)
    const userCount = await db.query.users.findFirst();
    const isFirstUser = !userCount;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user (first user becomes admin)
    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      role: isFirstUser ? "admin" : "viewer",
    });

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

export async function loginWithCredentials(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  // Rate limiting: 5 login attempts per 15 minutes per email
  const rateLimitKey = `login:${email.toLowerCase()}`;
  const rateLimit = checkRateLimit(rateLimitKey, { maxAttempts: 5, windowMs: 15 * 60 * 1000 });
  if (!rateLimit.success) {
    return { error: `Too many login attempts. Please try again in ${Math.ceil(rateLimit.resetIn / 60)} minutes.` };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
    // Reset rate limit on successful login (signIn will redirect, so this won't be reached on success)
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password" };
        default:
          return { error: "Something went wrong" };
      }
    }
    throw error;
  }
}

export async function loginWithGoogle() {
  await signIn("google", { redirectTo: "/dashboard" });
}

export async function loginWithGitHub() {
  await signIn("github", { redirectTo: "/dashboard" });
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
