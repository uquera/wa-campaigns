import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const campaign = await prisma.campaign.findUnique({
    where: { id: Number(id) },
    include: {
      template: true,
      messages: {
        include: { contact: { select: { name: true, phone: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(campaign)
}
