import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

// GET flow history
export async function GET() {
  try {
    const rows = await sql`
      SELECT 
        id,
        flow_id,
        flow_name,
        flow_data,
        saved_at
      FROM flow_history
      ORDER BY saved_at DESC
      LIMIT 50
    `

    const history = rows.map((row: any) => ({
      id: row.id,
      flowId: row.flow_id,
      flowName: row.flow_name,
      flowData: row.flow_data,
      savedAt: row.saved_at,
    }))

    return NextResponse.json({ history })
  } catch (error) {
    console.error("[v0] Error fetching flow history:", error)
    return NextResponse.json({ error: "Failed to fetch flow history" }, { status: 500 })
  }
}

// DELETE clear history
export async function DELETE() {
  try {
    await sql`DELETE FROM flow_history`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error clearing history:", error)
    return NextResponse.json({ error: "Failed to clear history" }, { status: 500 })
  }
}
