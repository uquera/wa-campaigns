import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendTemplateMessage } from "@/lib/whatsapp"

const DELAY_MS = 150 // ~6 msgs/sec — well within Meta limits

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const campaignId = Number(id)

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      template: true,
      messages: {
        where: { status: "PENDING" },
        include: { contact: true },
      },
    },
  })

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
  }

  if (campaign.status === "RUNNING") {
    return NextResponse.json({ error: "Campaign already running" }, { status: 409 })
  }

  if (campaign.messages.length === 0) {
    return NextResponse.json({ error: "No pending messages" }, { status: 400 })
  }

  // Mark as running immediately
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "RUNNING" },
  })

  const template = campaign.template
  const variables: Record<string, string> = campaign.variables
    ? JSON.parse(campaign.variables)
    : {}
  const buttons = template.buttons ? JSON.parse(template.buttons) : []

  // Run sending asynchronously (fire and forget)
  ;(async () => {
    let sent = 0
    let failed = 0

    for (const msg of campaign.messages) {
      const contact = msg.contact

      // Build body variables from contact fields
      const bodyVariables = Object.values(variables).map((field) => {
        if (field === "name") return contact.name
        if (field === "phone") return contact.phone
        const extra = contact.extra ? JSON.parse(contact.extra) : {}
        return String(extra[field] ?? "")
      })

      const result = await sendTemplateMessage({
        to: contact.phone,
        templateName: template.name,
        language: template.language,
        headerImageUrl: template.headerImage ?? undefined,
        bodyVariables,
        buttons,
      })

      if (result.error) {
        await prisma.campaignMessage.update({
          where: { id: msg.id },
          data: { status: "FAILED", error: result.error, sentAt: new Date() },
        })
        failed++
      } else {
        await prisma.campaignMessage.update({
          where: { id: msg.id },
          data: { status: "SENT", waMessageId: result.messageId, sentAt: new Date() },
        })
        sent++
      }

      await prisma.campaign.update({
        where: { id: campaignId },
        data: { sentCount: sent, failedCount: failed },
      })

      await sleep(DELAY_MS)
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "COMPLETED",
        sentCount: sent,
        failedCount: failed,
      },
    })
  })()

  return NextResponse.json({ ok: true, total: campaign.messages.length })
}
