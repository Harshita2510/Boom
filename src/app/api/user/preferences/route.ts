import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongoose";
import { UserModel } from "@/models";

const allowedLanguages = new Set([
  "english",
  "hindi",
  "marathi",
  "tamil",
  "telugu",
  "bengali",
  "gujarati",
  "kannada",
  "malayalam",
  "punjabi",
  "odia",
  "urdu",
  "assamese",
  "rajasthani",
  "mizo",
  "other"
]);

export async function PATCH(request: Request) {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const preferredLanguage =
    typeof body.preferredLanguage === "string"
      ? body.preferredLanguage.trim().toLowerCase()
      : "";

  if (!allowedLanguages.has(preferredLanguage)) {
    return NextResponse.json(
      { error: "Choose a supported language." },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  const user = await UserModel.findOneAndUpdate(
    { clerkId: clerkUser.id },
    {
      clerkId: clerkUser.id,
      email: email || `${clerkUser.id}@clerk.arthsathi.local`,
      firstName: clerkUser.firstName,
      imageUrl: clerkUser.imageUrl,
      lastActiveAt: new Date(),
      lastName: clerkUser.lastName,
      preferredLanguage
    },
    {
      new: true,
      setDefaultsOnInsert: true,
      upsert: true
    }
  );

  return NextResponse.json({
    preferredLanguage: String(user.preferredLanguage || preferredLanguage)
  });
}
