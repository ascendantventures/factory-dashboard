import { NextRequest, NextResponse } from 'next/server';
import { dispatchEvent } from '@/lib/webhook-dispatcher';
import { PIPELINE_EVENTS } from '@/lib/webhook-events';
import type { PipelineEvent } from '@/lib/webhook-events';

const KNOWN_EVENTS = new Set<string>(PIPELINE_EVENTS.map((e) => e.value));

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-factory-webhook-secret');
  const expectedSecret = process.env.FACTORY_WEBHOOK_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { event, issue, details } = body as {
    event?: string;
    issue?: { number: number; title: string; repo: string };
    details?: Record<string, unknown>;
  };

  if (!event || typeof event !== 'string') {
    return NextResponse.json({ error: 'event is required' }, { status: 400 });
  }

  if (!KNOWN_EVENTS.has(event)) {
    return NextResponse.json({ error: 'invalid event' }, { status: 400 });
  }

  const result = await dispatchEvent(
    event as PipelineEvent,
    details,
    issue
  );

  return NextResponse.json(result, { status: 200 });
}
