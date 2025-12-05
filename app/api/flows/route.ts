import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import type { Flow } from "@/lib/types"

// GET all flows (optionally filtered by roundId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roundId = searchParams.get("roundId")

    const rows = roundId
      ? await sql`
          SELECT * FROM flows 
          WHERE debate_round_id = ${roundId}
          ORDER BY created_at DESC
        `
      : await sql`
          SELECT * FROM flows 
          ORDER BY created_at DESC
        `

    const flows: Flow[] = rows.map((row: any) => ({
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
    }))

    return NextResponse.json({ flows })
  } catch (error) {
    console.error("[v0] Error fetching flows:", error)
    return NextResponse.json({ error: "Failed to fetch flows" }, { status: 500 })
  }
}

// POST create new flow
export async function POST(request: NextRequest) {
  try {
    const flow: Flow = await request.json()

    await sql`
      INSERT INTO flows (
        id, name, debate_style, content, level, columns, invert, index, last_focus, 
        children, speech_documents, archived, debate_round_id
      )
      VALUES (
        ${flow.id},
        ${flow.name},
        ${flow.debateStyle},
        ${flow.content || ""},
        ${flow.level || 0},
        ${JSON.stringify(flow.columns)},
        ${flow.invert || false},
        ${flow.index || 0},
        ${JSON.stringify(flow.lastFocus || [])},
        ${JSON.stringify(flow.children)},
        ${JSON.stringify(flow.speechDocs || {})},
        ${flow.archived || false},
        ${flow.debateRoundId || null}
      )
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
    console.error("[v0] Error creating flow:", error)
    return NextResponse.json({ error: "Failed to create flow" }, { status: 500 })
  }
}
