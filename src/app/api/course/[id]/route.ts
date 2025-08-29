"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "User not authorized" },
        { status: 401 }
      );
    }

    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    const getCourse = await db.course.findUnique({
      where: {
        id: id, // Use the course ID from params
      },
    });

    if (!getCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Optional: Check if the authenticated user is the instructor of this course
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user || getCourse.instructorId !== user.id) {
      return NextResponse.json(
        { error: "Access denied. You are not the instructor of this course." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        message: "Course retrieved successfully",
        course: getCourse,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Course retrieval error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
