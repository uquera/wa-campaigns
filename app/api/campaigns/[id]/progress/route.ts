import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const campaignId = Number(id)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      let done = false
      while (!done) {
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: {
            status: true,
            totalCount: true,
            sentCount: true,
            failedCount: true,
          },
        })

        if (!campaign) {
          send({ error: "Not found" })
          break
        }

        send(campaign)

        if (campaign.status === "COMPLETED" || campaign.status === "FAILED") {
          done = true
        } else {
          await new Promise((r) => setTimeout(r, 1000))
        }
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
