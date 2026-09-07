import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

export function GET() {
  const css = readFileSync(
    join(process.cwd(), "src/app/globals.css"),
    "utf-8"
  );
  return new NextResponse(css, {
    headers: { "Content-Type": "text/css; charset=utf-8" },
  });
}
