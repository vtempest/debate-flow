import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import type { Flow } from "@/lib/types"

// GET single flow by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rows = await sql`
      SELECT * FROM flows WHERE id = ${params.id}
    `

    if (rows.length === 0) {
      return NextResponse.json({ error: "Flow not found" }, { status: 404 })
    }

    const row = rows[0]
    const flow: Flow = {
      id: row.id,
      name: row.name,
      debateStyle: row.debate_style,
      content: row.content || "",
      level: row.level || 0,
      columns: row.columns || [],
      invert: row.invert || false,
      focus: false,
      index: row.index || 0,
      lastFocus: row.last_focus || [],
      children: row.children || [],
      speechDocs: row.speech_documents || {},
      archived: row.archived || false,
      debateRoundId: row.debate_round_id,
    }

    return NextResponse.json({ flow })
  } catch (error) {
    console.error("[v0] Error fetching flow:", error)
    return NextResponse.json({ error: "Failed to fetch flow" }, { status: 500 })
  }
}

// PUT update flow
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const flow: Flow = await request.json()

    await sql`
      UPDATE flows
      SET 
        name = ${flow.name},
        debate_style = ${flow.debateStyle},
        content = ${flow.content || ""},
        level = ${flow.level || 0},
        columns = ${JSON.stringify(flow.columns)},
        invert = ${flow.invert || false},
        index = ${flow.index || 0},
        last_focus = ${JSON.stringify(flow.lastFocus || [])},
        children = ${JSON.stringify(flow.children)},
        speech_documents = ${JSON.stringify(flow.speechDocs || {})},
        archived = ${flow.archived || false},
        debate_round_id = ${flow.debateRoundId || null},
        updated_at = NOW()
      WHERE id = ${params.id}
    `

    // Save to history
    await sql`
      INSERT INTO flow_history (flow_id, flow_name, flow_data)
      VALUES (
        ${flow.id},
        ${flow.name},
        ${JSON.stringify(flow)}
      )
    `

    return NextResponse.json({ success: true, flow })
  } catch (error) {
    console.error("[v0] Error updating flow:", error)
    return NextResponse.json({ error: "Failed to update flow" }, { status: 500 })
  }
}

// DELETE flow
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await sql`
      DELETE FROM flows WHERE id = ${params.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting flow:", error)
    return NextResponse.json({ error: "Failed to delete flow" }, { status: 500 })
  }
}
