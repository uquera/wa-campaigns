const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!
const TOKEN = process.env.WHATSAPP_TOKEN!
const BASE_URL = "https://graph.facebook.com/v21.0"

export interface TemplateButton {
  text: string
}

export interface SendTemplateParams {
  to: string
  templateName: string
  language?: string
  headerImageUrl?: string
  bodyVariables?: string[]
  buttons?: TemplateButton[]
}

export interface WhatsAppSendResult {
  messageId?: string
  error?: string
}

export async function sendTemplateMessage({
  to,
  templateName,
  language = "es",
  headerImageUrl,
  bodyVariables = [],
  buttons = [],
}: SendTemplateParams): Promise<WhatsAppSendResult> {
  const components: object[] = []

  if (headerImageUrl) {
    components.push({
      type: "header",
      parameters: [
        {
          type: "image",
          image: { link: headerImageUrl },
        },
      ],
    })
  }

  if (bodyVariables.length > 0) {
    components.push({
      type: "body",
      parameters: bodyVariables.map((text) => ({ type: "text", text })),
    })
  }

  buttons.forEach((btn, index) => {
    components.push({
      type: "button",
      sub_type: "quick_reply",
      index,
      parameters: [{ type: "payload", payload: btn.text }],
    })
  })

  try {
    const res = await fetch(`${BASE_URL}/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: language },
          components,
        },
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      const errMsg =
        data?.error?.message ?? `HTTP ${res.status}`
      return { error: errMsg }
    }

    return { messageId: data?.messages?.[0]?.id }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}
