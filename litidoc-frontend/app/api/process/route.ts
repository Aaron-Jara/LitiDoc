import { NextRequest, NextResponse } from "next/server";
import { proxyToFastApi } from "@/lib/server/fastapi";

async function toNextResponse(response: Response): Promise<NextResponse> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  }

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: { "content-type": contentType || "text/plain" },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const resume = request.nextUrl.searchParams.get("resume") === "1";
  const jobId = request.nextUrl.searchParams.get("job_id");

  if (resume) {
    if (!jobId) {
      return NextResponse.json(
        { error: "Missing required query parameter: job_id" },
        { status: 400 },
      );
    }

    try {
      const backendResponse = await proxyToFastApi(
        `/resume/${encodeURIComponent(jobId)}`,
        { method: "POST" },
      );
      return toNextResponse(backendResponse);
    } catch (error) {
      console.error("POST /api/process resume proxy error:", error);
      return NextResponse.json(
        { error: "Failed to resume job." },
        { status: 503 },
      );
    }
  }

  try {
    const formData = await request.formData();

    const backendResponse = await proxyToFastApi("/process", {
      method: "POST",
      body: formData,
    });

    return toNextResponse(backendResponse);
  } catch (error) {
    console.error("POST /api/process proxy error:", error);
    return NextResponse.json(
      { error: "Failed to process request." },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const jobId = request.nextUrl.searchParams.get("job_id");

    if (!jobId) {
      return NextResponse.json(
        { error: "Missing required query parameter: job_id" },
        { status: 400 },
      );
    }

    // TODO: Add auth headers / request validation before forwarding.
    const backendResponse = await proxyToFastApi(
      `/status/${encodeURIComponent(jobId)}?lite=1`,
      { method: "GET" },
      15_000,
    );

    return toNextResponse(backendResponse);
  } catch (error) {
    console.error("GET /api/process proxy error:", error);
    const message =
      error instanceof Error && error.name === "TimeoutError"
        ? "Backend status check timed out. The server may be busy processing documents."
        : "Backend temporarily unavailable. Retrying…";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
