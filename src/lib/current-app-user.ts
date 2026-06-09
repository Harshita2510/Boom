import { currentUser } from "@clerk/nextjs/server";

import { UserModel } from "@/models";

export async function getOrCreateCurrentAppUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    return null;
  }

  return UserModel.findOneAndUpdate(
    { clerkId: clerkUser.id },
    {
      clerkId: clerkUser.id,
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
      lastActiveAt: new Date()
    },
    {
      new: true,
      setDefaultsOnInsert: true,
      upsert: true
    }
  );
}
