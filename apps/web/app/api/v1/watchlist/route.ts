import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const createSchema = z.object({
  entityType: z.enum(['TEAM', 'GAME']),
  entityId: z.string().min(1, 'Entity identifier is required'),
  displayName: z.string().min(1).optional(),
  alertLeadChange: z.boolean().optional(),
  alertUpsetProbability: z.boolean().optional(),
  alertGameStart: z.boolean().optional()
});

const updateSchema = z.object({
  id: z.string().cuid('A valid watchlist identifier is required'),
  displayName: z.string().min(1).optional(),
  alertLeadChange: z.boolean().optional(),
  alertUpsetProbability: z.boolean().optional(),
  alertGameStart: z.boolean().optional()
});

export async function GET(): Promise<NextResponse> {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const items = await prisma.watchlistPreference.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' }
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request): Promise<NextResponse> {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const item = await prisma.watchlistPreference.create({
      data: {
        userId,
        entityType: parsed.data.entityType,
        entityId: parsed.data.entityId,
        displayName: parsed.data.displayName,
        alertLeadChange: parsed.data.alertLeadChange ?? false,
        alertUpsetProbability: parsed.data.alertUpsetProbability ?? false,
        alertGameStart: parsed.data.alertGameStart ?? false
      }
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'Watchlist entry already exists for this team or game.' },
        { status: 409 }
      );
    }

    console.error('[watchlist][POST]', error);
    return NextResponse.json({ error: 'Failed to create watchlist entry.' }, { status: 500 });
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...changes } = parsed.data;

  const existing = await prisma.watchlistPreference.findFirst({
    where: { id, userId }
  });

  if (!existing) {
    return NextResponse.json({ error: 'Watchlist entry not found.' }, { status: 404 });
  }

  const updated = await prisma.watchlistPreference.update({
    where: { id },
    data: { ...changes }
  });

  return NextResponse.json({ item: updated });
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Watchlist id is required.' }, { status: 400 });
  }

  const existing = await prisma.watchlistPreference.findFirst({
    where: { id, userId }
  });

  if (!existing) {
    return NextResponse.json({ error: 'Watchlist entry not found.' }, { status: 404 });
  }

  await prisma.watchlistPreference.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
