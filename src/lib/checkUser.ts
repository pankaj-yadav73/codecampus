import { db } from "./db";
import { currentUser } from "@clerk/nextjs/server";

export async function CheckInUser() {
  const user = await currentUser();
  if (!user) {
    throw new Error("user not authorized");
  }

  try {
    const loggedInUser = db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
    });
    if (loggedInUser) {
      return loggedInUser;
    }

    const name = `${user.firstName} ${user.lastName}`;

    const newUser = db.user.create({
      data: {
        clerkUserId: user.id,
        name,
        image: user.imageUrl,
        email: user.emailAddresses[0].emailAddress,
      },
    });

    return newUser;
  } catch (error: any) {
    console.log(error.message);
  }
}
