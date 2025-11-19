import { NextRequest, NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongodb';
import StudySpot from '@/models/StudySpot';
import User from '@/models/User';

// Force Next.js to always fetch fresh data from the DB
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    await connectMongoDB();
    const spots = await StudySpot.find();
    return NextResponse.json({ spots });
  } catch (error) {
    console.error('Error fetching spots:', error);
    return NextResponse.json({ error: 'Failed to fetch spots' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const email = req.headers.get('x-user-email');
    if (!email) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    await connectMongoDB();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const {
      name,
      description,
      address,
      coordinates = { lat: 0, lng: 0 },
      tags = [],
      image,
    } = await req.json();

    const newSpot = await StudySpot.create({
      name,
      description,
      address,
      coordinates,
      tags,
      image,
      owner: user._id,
    });

    // Initialize uploadedSpots if it doesn't exist
    if (!user.uploadedSpots) {
        user.uploadedSpots = [];
    }
    user.uploadedSpots.push(newSpot._id);
    await user.save();

    return NextResponse.json(
      { message: 'Study spot added', spot: newSpot },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating study spot:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}