import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit): NextResponse<{ data: T }> {
  return NextResponse.json({ data }, { status: 200, ...init });
}

export function created<T>(data: T): NextResponse<{ data: T }> {
  return NextResponse.json({ data }, { status: 201 });
}

export function fail(message: string, status = 400): NextResponse<{ error: string }> {
  return NextResponse.json({ error: message }, { status });
}
