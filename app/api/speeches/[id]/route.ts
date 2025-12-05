import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

// GET single speech
export async function GET(request: Request, { params }: { params: { id: string } }) {
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
      WHERE id = ${params.id}
    `

    if (speeches.length === 0) {
      return NextResponse.json({ error: "Speech not found" }, { status: 404 })
    }

    return NextResponse.json({ speech: speeches[0] })
  } catch (error) {
    console.error("Error fetching speech:", error)
    return NextResponse.json({ error: "Failed to fetch speech" }, { status: 500 })
  }
}

// PUT update speech
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, content, markdown } = body

    await sql`
      UPDATE speeches
      SET name = ${name}, content = ${content}, markdown = ${markdown}, updated_at = NOW()
      WHERE id = ${params.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating speech:", error)
    return NextResponse.json({ error: "Failed to update speech" }, { status: 500 })
  }
}

// DELETE speech
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await sql`DELETE FROM speeches WHERE id = ${params.id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting speech:", error)
    return NextResponse.json({ error: "Failed to delete speech" }, { status: 500 })
  }
}
