import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN

// Meta calls GET to verify the webhook endpoint
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }

  return new Response("Forbidden", { status: 403 })
}

// Meta calls POST with message status updates
export async function POST(req: NextRequest) {
  const body = await req.json()

  try {
    const entries = body?.entry ?? []

    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        const statuses = change.value?.statuses ?? []

        for (const status of statuses) {
          const waMessageId = status.id
          const statusValue: string = status.status // sent | delivered | read | failed

          if (!waMessageId) continue

          const mapped = mapStatus(statusValue)
          if (!mapped) continue

          await prisma.campaignMessage.updateMany({
            where: { waMessageId },
            data: { status: mapped },
          })
        }
      }
    }
  } catch (err) {
    console.error("[webhook] Error processing:", err)
  }

  // Always return 200 so Meta doesn't retry
  return NextResponse.json({ ok: true })
}

function mapStatus(waStatus: string): string | null {
  switch (waStatus) {
    case "sent":
      return "SENT"
    case "delivered":
      return "DELIVERED"
    case "read":
      return "READ"
    case "failed":
      return "FAILED"
    default:
      return null
  }
}
