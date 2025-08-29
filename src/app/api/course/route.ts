"use server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { courseSchema } from "@/validators/coursesSchema";
import { NextResponse } from "next/server";

import s3Client from "@/lib/s3Client";
import { PutObjectCommand } from "@aws-sdk/client-s3";

async function uploadFileToS3(file: File, key: string) {
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);
    return key; // Return the S3 key for database storage
  } catch (error) {
    console.error("S3 upload error:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "User not authorized" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    const data = await request.formData();

    let validatedData;

    try {
      validatedData = await courseSchema.parse({
        title: data.get("title") as string,
        description: data.get("description") as string,
        image: data.get("image"),
        videoFile: data.get("videoFile"), // Fixed: matches the schema field name
      });
    } catch (error) {
      console.error("Validation error:", error);
      return NextResponse.json(
        { error: "Invalid form data", details: error },
        { status: 400 }
      );
    }

    const inputImageFile = validatedData?.image as File;
    const inputVideoFile = validatedData?.videoFile as File; // Fixed: use videofile not videoFile

    if (!inputImageFile || !inputVideoFile) {
      console.error("Missing files: Image or video file is missing");
      return NextResponse.json(
        { error: "Image or video file is missing" },
        { status: 400 }
      );
    }

    // Generate unique filenames
    const imageFilename = `uploads/images/${Date.now()}_${inputImageFile.name}`;
    const videoFilename = `uploads/videos/${Date.now()}_${inputVideoFile.name}`;

    // Upload files to S3 in parallel
    await Promise.all([
      uploadFileToS3(inputImageFile, imageFilename),
      uploadFileToS3(inputVideoFile, videoFilename),
    ]);

    console.log("Saving course data to database with instructor ID:", user?.id);

    // Create course in database
    const result = await db.course.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        image: imageFilename,
        videoFile: videoFilename,
        instructorId: user?.id,
      },
    });

    console.log("Course created successfully:", result);

    return NextResponse.json(
      {
        message: "Course created successfully",
        course: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Course creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "User not authorized" }, { status: 401 });
  }
  const user = await db.user.findUnique({
    where: {
      clerkUserId: userId,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  try {
    // Get all courses for the instructor
    const courses = await db.course.findMany({
      where: {
        instructorId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        message: "Courses retrieved successfully",
        courses: courses,
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
