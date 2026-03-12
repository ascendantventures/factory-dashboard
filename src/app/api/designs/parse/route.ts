import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { PenFile, PenFileSummary } from '@/lib/pen-types';

function parsePenFile(json: unknown): PenFileSummary {
  const pen = json as PenFile;

  if (!pen.canvas || !Array.isArray(pen.canvas.frames)) {
    throw { status: 422, message: 'Invalid .pen format: missing canvas.frames' };
  }

  const frames = pen.canvas.frames.map((f) => ({
    id: f.id,
    name: f.name,
    width: f.width,
    height: f.height,
  }));

  const variables = pen.canvas.variables ?? [];
  const colors = variables
    .filter((v) => v.type === 'color')
    .map((v) => ({ name: v.name, value: String(v.value) }));

  const typography = variables
    .filter((v) => v.type === 'typography')
    .map((v) => ({
      name: v.name,
      fontFamily: v.fontFamily ?? '',
      fontSize: v.fontSize ?? 0,
      fontWeight: v.fontWeight ?? 400,
    }));

  const spacing = variables
    .filter((v) => v.type === 'spacing' || v.type === 'number')
    .map((v) => ({ name: v.name, value: Number(v.value) }));

  return {
    frameCount: frames.length,
    frames,
    tokens: { colors, typography, spacing },
    canvas: { width: pen.canvas.width, height: pen.canvas.height },
  };
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contentType = request.headers.get('content-type') ?? '';

  try {
    let json: unknown;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }
      const text = await file.text();
      json = JSON.parse(text);
    } else {
      const body = await request.json() as { fileUrl?: string };
      if (!body.fileUrl) {
        return NextResponse.json({ error: 'fileUrl is required' }, { status: 400 });
      }
      const res = await fetch(body.fileUrl);
      if (!res.ok) {
        return NextResponse.json({ error: `Failed to fetch file: ${res.status}` }, { status: 400 });
      }
      json = await res.json();
    }

    const summary = parsePenFile(json);
    return NextResponse.json(summary);
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
      const e = err as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    const message = err instanceof SyntaxError ? err.message : 'Failed to parse .pen file';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
