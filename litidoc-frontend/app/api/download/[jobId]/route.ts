import { NextRequest, NextResponse } from "next/server";
import { proxyToFastApi } from "@/lib/server/fastapi";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ jobId: string }> },
): Promise<NextResponse> {
  const { jobId } = await context.params;

  try {
    const backendResponse = await proxyToFastApi(
      `/download/${encodeURIComponent(jobId)}`,
      { method: "GET" },
    );

    const headers = new Headers();
    const contentType = backendResponse.headers.get("content-type");
    const contentDisposition = backendResponse.headers.get("content-disposition");

    if (contentType) {
      headers.set("content-type", contentType);
    }
    if (contentDisposition) {
      headers.set("content-disposition", contentDisposition);
    }

    const body = await backendResponse.arrayBuffer();
    return new NextResponse(body, {
      status: backendResponse.status,
      headers,
    });
  } catch (error) {
    console.error(`GET /api/download/${jobId} proxy error:`, error);
    return NextResponse.json(
      { detail: "Failed to download Excel schedule." },
      { status: 500 },
    );
  }
}
