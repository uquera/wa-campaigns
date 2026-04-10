const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!
const TOKEN = process.env.WHATSAPP_TOKEN!
const BASE_URL = "https://graph.facebook.com/v21.0"

export type ButtonType = "QUICK_REPLY" | "URL" | "PHONE_NUMBER"

export interface TemplateButton {
  text: string
  type: ButtonType
  value?: string // URL para tipo URL, teléfono para PHONE_NUMBER
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
      parameters: [{ type: "image", image: { link: headerImageUrl } }],
    })
  }

  if (bodyVariables.length > 0) {
    components.push({
      type: "body",
      parameters: bodyVariables.map((text) => ({ type: "text", text })),
    })
  }

  // Solo QUICK_REPLY requiere parámetros al enviar.
  // URL y PHONE_NUMBER son estáticos — la URL/teléfono está en el template aprobado en Meta.
  buttons.forEach((btn, index) => {
    if (btn.type === "QUICK_REPLY") {
      components.push({
        type: "button",
        sub_type: "quick_reply",
        index,
        parameters: [{ type: "payload", payload: btn.text }],
      })
    }
    // URL con sufijo dinámico (ej: ID de pedido personalizado por contacto)
    if (btn.type === "URL" && btn.value?.includes("{{1}}")) {
      components.push({
        type: "button",
        sub_type: "url",
        index,
        parameters: [{ type: "text", text: "" }],
      })
    }
    // PHONE_NUMBER: sin parámetros necesarios
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
      return { error: data?.error?.message ?? `HTTP ${res.status}` }
    }

    return { messageId: data?.messages?.[0]?.id }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}
