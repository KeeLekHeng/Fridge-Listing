import bcrypt from 'bcrypt'
import { prisma } from '../lib/prisma'

async function seed() {
  const username = process.env.ADMIN_USERNAME
  const password = process.env.ADMIN_PASSWORD

  if (!username || !password) {
    console.error('ADMIN_USERNAME and ADMIN_PASSWORD must be set')
    process.exit(1)
  }

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    console.log(`Admin user "${username}" already exists — skipping`)
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.create({ data: { username, passwordHash } })
  console.log(`Admin user "${username}" created`)
}

seed()
  .catch((err) => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
