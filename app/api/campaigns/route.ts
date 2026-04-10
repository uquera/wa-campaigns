import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const campaigns = await prisma.campaign.findMany({
    include: { template: { select: { displayName: true, name: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(campaigns)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, templateId, contactIds, variables } = body

  if (!name || !templateId || !contactIds?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const campaign = await prisma.campaign.create({
    data: {
      name,
      templateId: Number(templateId),
      variables: variables ? JSON.stringify(variables) : null,
      totalCount: contactIds.length,
      messages: {
        create: contactIds.map((contactId: number) => ({ contactId })),
      },
    },
    include: { template: true },
  })

  return NextResponse.json(campaign, { status: 201 })
}
