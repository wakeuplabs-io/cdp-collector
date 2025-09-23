import { CdpService } from "@/lib/services/cdp";
import { NextResponse } from "next/server";

// TODO: cors workaround
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sql } = body;
    if (!sql) {
      return NextResponse.json({ error: "SQL is required" }, { status: 400 });
    }

    return NextResponse.json(await CdpService.sqlQueryEvents(sql));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to get events" },
      { status: 500 }
    );
  }
}
