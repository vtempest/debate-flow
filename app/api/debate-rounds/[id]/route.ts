import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

// GET single debate round with populated flows and speeches
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const rounds = await sql`
      SELECT 
        id,
        name,
        description,
        debater_aff_1 as "debaterAff1",
        debater_aff_2 as "debaterAff2",
        debater_neg_1 as "debaterNeg1",
        debater_neg_2 as "debaterNeg2",
        judge_name as "judgeName",
        flow_ids as "flowIds",
        speech_ids as "speechIds",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM debate_rounds
      WHERE id = ${params.id}
    `

    if (rounds.length === 0) {
      return NextResponse.json({ error: "Debate round not found" }, { status: 404 })
    }

    const round = rounds[0]

    // Fetch associated flows
    if (round.flowIds && round.flowIds.length > 0) {
      const flows = await sql`
        SELECT * FROM flows WHERE id = ANY(${round.flowIds})
      `
      round.flows = flows
    }

    // Fetch associated speeches
    if (round.speechIds && round.speechIds.length > 0) {
      const speeches = await sql`
        SELECT * FROM speeches WHERE id = ANY(${round.speechIds})
      `
      round.speeches = speeches
    }

    return NextResponse.json({ round })
  } catch (error) {
    console.error("Error fetching debate round:", error)
    return NextResponse.json({ error: "Failed to fetch debate round" }, { status: 500 })
  }
}

// PUT update debate round
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, description, debaterAff1, debaterAff2, debaterNeg1, debaterNeg2, judgeName, flowIds, speechIds } =
      body

    await sql`
      UPDATE debate_rounds
      SET 
        name = ${name}, 
        description = ${description},
        debater_aff_1 = ${debaterAff1},
        debater_aff_2 = ${debaterAff2},
        debater_neg_1 = ${debaterNeg1},
        debater_neg_2 = ${debaterNeg2},
        judge_name = ${judgeName},
        flow_ids = ${JSON.stringify(flowIds)},
        speech_ids = ${JSON.stringify(speechIds)},
        updated_at = NOW()
      WHERE id = ${params.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating debate round:", error)
    return NextResponse.json({ error: "Failed to update debate round" }, { status: 500 })
  }
}

// DELETE debate round
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await sql`DELETE FROM debate_rounds WHERE id = ${params.id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting debate round:", error)
    return NextResponse.json({ error: "Failed to delete debate round" }, { status: 500 })
  }
}
