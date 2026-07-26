import { PickupSpot, SwapEvent } from '../types';

let memorySpots: PickupSpot[] = [];
let memoryEvents: SwapEvent[] = [];

export const subscribeToPickupSpots = (callback: (spots: PickupSpot[]) => void) => {
  callback(memorySpots);
  return () => {};
};

export const addPickupSpot = async (spot: Partial<PickupSpot>) => {
  const newSpot: PickupSpot = {
    id: 'spot_' + Math.random().toString(36).substring(2, 9),
    name: spot.name || 'Pickup Spot',
    address: spot.address || '',
    category: spot.category || 'Community Shelf',
    addedBy: spot.addedBy || 'user',
    ...spot,
  };
  memorySpots.push(newSpot);
  return newSpot;
};

export const subscribeToSwapEvents = (callback: (events: SwapEvent[]) => void) => {
  callback(memoryEvents);
  return () => {};
};

export const createSwapEvent = async (event: Partial<SwapEvent>) => {
  const newEvent: SwapEvent = {
    id: 'event_' + Math.random().toString(36).substring(2, 9),
    title: event.title || 'Book Swap Event',
    date: event.date || new Date().toISOString(),
    location: event.location || '',
    organizer: event.organizer || 'user',
    attendees: event.attendees || [],
    ...event,
  };
  memoryEvents.push(newEvent);
  return newEvent;
};

export const toggleEventRSVP = async (eventId: string, userId: string, hasAttended: boolean) => {
  const evt = memoryEvents.find((e) => e.id === eventId);
  if (evt) {
    if (hasAttended) {
      evt.attendees = (evt.attendees || []).filter((id) => id !== userId);
    } else {
      evt.attendees = [...(evt.attendees || []), userId];
    }
  }
};
