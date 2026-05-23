import type { FastifyInstance } from 'fastify'
import { findListingByCode, changeListingStatus, changeListingPrices, changeListingNote } from '../../services/listing'

const ADMIN_CHAT_IDS: Set<number> = new Set(
  (process.env.TELEGRAM_ADMIN_CHAT_ID ?? '').split(',').map((s) => parseInt(s.trim(), 10)).filter(Boolean),
)

async function sendMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch(() => undefined)
}

function formatListing(l: {
  listingCode: string; brand: string; location: string; condition: string; status: string;
  buyEnabled: boolean; buyPrice: unknown; rentEnabled: boolean; rentPrice: unknown;
  depositPrice: unknown; deliveryAvailable: boolean; deliveryPrice: unknown; adminNote: string | null
}) {
  const lines = [
    `${l.listingCode} — ${l.brand}`,
    `Location: ${l.location}`,
    `Condition: ${l.condition}`,
    `Status: ${l.status}`,
  ]
  if (l.rentEnabled) lines.push(`Rent: RM ${l.rentPrice}/mo, deposit RM ${l.depositPrice}`)
  if (l.buyEnabled) lines.push(`Buy: RM ${l.buyPrice}`)
  if (l.deliveryAvailable) lines.push(`Delivery: RM ${l.deliveryPrice}`)
  if (l.adminNote) lines.push(`Note: ${l.adminNote}`)
  return lines.join('\n')
}

const STATUS_COMMANDS: Record<string, string> = {
  reserve: 'reserved',
  available: 'available',
  rented: 'rented',
  sold: 'sold',
  unavailable: 'unavailable',
}

async function handleMessage(chatId: number, text: string) {
  if (!text.startsWith('/')) return

  const [rawCmd, ...args] = text.split(/\s+/)
  const cmd = rawCmd.split('@')[0].slice(1).toLowerCase()

  if (cmd === 'status') {
    const code = args[0]
    if (!code) { await sendMessage(chatId, 'Usage: /status <listing-code>'); return }
    const listing = await findListingByCode(code)
    if (!listing) { await sendMessage(chatId, `Listing ${code.toUpperCase()} not found.`); return }
    await sendMessage(chatId, formatListing(listing))
    return
  }

  if (cmd in STATUS_COMMANDS) {
    const code = args[0]
    if (!code) { await sendMessage(chatId, `Usage: /${cmd} <listing-code>`); return }
    const listing = await findListingByCode(code)
    if (!listing) { await sendMessage(chatId, `Listing ${code.toUpperCase()} not found.`); return }
    const newStatus = STATUS_COMMANDS[cmd]
    await changeListingStatus(listing.id, listing.status, newStatus, 'telegram_bot')
    await sendMessage(chatId, `${listing.listingCode} marked as ${newStatus}.`)
    return
  }

  if (cmd === 'price') {
    const code = args[0]
    if (!code || args.length < 2) {
      await sendMessage(chatId, 'Usage: /price <code> [buy=X] [rent=Y] [deposit=Z] [delivery=W]')
      return
    }
    const listing = await findListingByCode(code)
    if (!listing) { await sendMessage(chatId, `Listing ${code.toUpperCase()} not found.`); return }

    const prices: { buyPrice?: number | null; rentPrice?: number; depositPrice?: number; deliveryPrice?: number } = {}
    for (const arg of args.slice(1)) {
      const [key, val] = arg.split('=')
      const num = parseFloat(val)
      if (isNaN(num)) { await sendMessage(chatId, `Invalid price value: ${arg}`); return }
      if (key === 'buy') prices.buyPrice = num
      else if (key === 'rent') prices.rentPrice = num
      else if (key === 'deposit') prices.depositPrice = num
      else if (key === 'delivery') prices.deliveryPrice = num
    }

    if (Object.keys(prices).length === 0) {
      await sendMessage(chatId, 'Usage: /price <code> [buy=X] [rent=Y] [deposit=Z] [delivery=W]')
      return
    }

    await changeListingPrices(listing.id, prices, 'telegram_bot')
    await sendMessage(chatId, `${listing.listingCode} prices updated.`)
    return
  }

  if (cmd === 'note') {
    const code = args[0]
    const note = args.slice(1).join(' ')
    if (!code || !note) { await sendMessage(chatId, 'Usage: /note <code> <text>'); return }
    const listing = await findListingByCode(code)
    if (!listing) { await sendMessage(chatId, `Listing ${code.toUpperCase()} not found.`); return }
    await changeListingNote(listing.id, note, 'telegram_bot')
    await sendMessage(chatId, `${listing.listingCode} note updated.`)
    return
  }

  // Unknown command — silently ignore
}

export async function telegramWebhookRoutes(app: FastifyInstance) {
  app.post('/telegram/webhook', async (request, reply) => {
    const secret = (request.headers['x-telegram-bot-api-secret-token'] as string | undefined) ?? ''
    if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return reply.status(403).send()
    }

    // Secret validated — parse before responding so errors become bot replies, not 500s
    try {
      const body = request.body as Record<string, unknown>
      const message = body?.message as Record<string, unknown> | undefined

      if (message) {
        const chatId = (message.chat as Record<string, unknown>)?.id
        const text = typeof message.text === 'string' ? message.text.trim() : ''

        // Integer comparison — Telegram sends chat.id as a number
        if (typeof chatId === 'number' && ADMIN_CHAT_IDS.has(chatId)) {
          await handleMessage(chatId, text)
        }
        // Non-admin messages: silently ignored, no log, no reply
      }
    } catch (err) {
      app.log.error(err, 'Telegram webhook processing error')
    }

    // Always 200 to Telegram regardless of outcome
    return reply.status(200).send()
  })
}
