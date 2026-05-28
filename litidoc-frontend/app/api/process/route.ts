import { NextRequest, NextResponse } from "next/server";

const FASTAPI_BASE_URL = "http://localhost:8000";

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
  try {
    const formData = await request.formData();

    // TODO: Add auth headers / request validation before forwarding.
    const backendResponse = await fetch(`${FASTAPI_BASE_URL}/process`, {
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
    const backendResponse = await fetch(
      `${FASTAPI_BASE_URL}/status/${encodeURIComponent(jobId)}`,
      {
        method: "GET",
      },
    );

    return toNextResponse(backendResponse);
  } catch (error) {
    console.error("GET /api/process proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch job status." },
      { status: 500 },
    );
  }
}
