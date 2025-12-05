import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

// GET all debate rounds with their flows and speeches
export async function GET() {
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
      ORDER BY created_at DESC
    `

    return NextResponse.json({ rounds })
  } catch (error) {
    console.error("Error fetching debate rounds:", error)
    return NextResponse.json({ error: "Failed to fetch debate rounds" }, { status: 500 })
  }
}

// POST create new debate round
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      id,
      name,
      description = "",
      debaterAff1 = "",
      debaterAff2 = "",
      debaterNeg1 = "",
      debaterNeg2 = "",
      judgeName = "",
      flowIds = [],
      speechIds = [],
    } = body

    await sql`
      INSERT INTO debate_rounds (
        id, name, description, 
        debater_aff_1, debater_aff_2, 
        debater_neg_1, debater_neg_2, 
        judge_name, flow_ids, speech_ids, updated_at
      )
      VALUES (
        ${id}, ${name}, ${description},
        ${debaterAff1}, ${debaterAff2},
        ${debaterNeg1}, ${debaterNeg2},
        ${judgeName}, ${JSON.stringify(flowIds)}, ${JSON.stringify(speechIds)}, NOW()
      )
      ON CONFLICT (id) DO UPDATE 
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
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error creating debate round:", error)
    return NextResponse.json({ error: "Failed to create debate round" }, { status: 500 })
  }
}
