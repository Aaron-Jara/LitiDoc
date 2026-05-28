import { NextRequest, NextResponse } from "next/server";
import { proxyToFastApi } from "@/lib/server/fastapi";

const RESOURCE_PATHS: Record<string, string> = {
  timeline: "timeline",
  "timeline-highlights": "timeline-highlights",
  index: "index",
  background: "background",
  classifications: "classifications",
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ jobId: string; resource: string }> },
): Promise<NextResponse> {
  const { jobId, resource } = await context.params;
  const backendSegment = RESOURCE_PATHS[resource];

  if (!backendSegment) {
    return NextResponse.json({ detail: "Unknown resource." }, { status: 404 });
  }

  try {
    const backendResponse = await proxyToFastApi(
      `/${backendSegment}/${encodeURIComponent(jobId)}`,
      { method: "GET" },
    );

    const contentType = backendResponse.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const data = await backendResponse.json();
      return NextResponse.json(data, { status: backendResponse.status });
    }

    const text = await backendResponse.text();
    return new NextResponse(text, {
      status: backendResponse.status,
      headers: { "content-type": contentType || "text/plain" },
    });
  } catch (error) {
    console.error(`GET /api/jobs/${jobId}/${resource} proxy error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch job artifact." },
      { status: 500 },
    );
  }
}
