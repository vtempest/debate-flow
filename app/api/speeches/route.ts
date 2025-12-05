import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

// GET all speeches
export async function GET() {
  try {
    const speeches = await sql`
      SELECT 
        id,
        name,
        content,
        markdown,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM speeches
      ORDER BY created_at DESC
    `

    return NextResponse.json({ speeches })
  } catch (error) {
    console.error("Error fetching speeches:", error)
    return NextResponse.json({ error: "Failed to fetch speeches" }, { status: 500 })
  }
}

// POST create new speech
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, name, content = "", markdown = "" } = body

    await sql`
      INSERT INTO speeches (id, name, content, markdown, updated_at)
      VALUES (${id}, ${name}, ${content}, ${markdown}, NOW())
      ON CONFLICT (id) DO UPDATE 
      SET name = ${name}, content = ${content}, markdown = ${markdown}, updated_at = NOW()
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error creating speech:", error)
    return NextResponse.json({ error: "Failed to create speech" }, { status: 500 })
  }
}
