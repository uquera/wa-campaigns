import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const templates = await prisma.template.findMany({
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(templates)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, displayName, category, language, headerImage, body: msgBody, buttons } = body

  if (!name || !displayName || !category || !msgBody) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // name must be snake_case for Meta
  const metaName = name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")

  try {
    const template = await prisma.template.create({
      data: {
        name: metaName,
        displayName,
        category,
        language: language ?? "es",
        headerImage: headerImage || null,
        body: msgBody,
        buttons: buttons ? JSON.stringify(buttons) : null,
        status: "PENDING",
      },
    })
    return NextResponse.json(template, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Template name already exists" }, { status: 409 })
  }
}
