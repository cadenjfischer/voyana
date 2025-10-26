// @ts-expect-error - Amadeus doesn't have TypeScript definitions
import Amadeus from 'amadeus';
import { NormalizedFlight } from './duffelClient';

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID!,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET!,
});

interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers?: number;
  cabinClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
}

export async function searchFlights(params: SearchParams): Promise<NormalizedFlight[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: params.origin,
      destinationLocationCode: params.destination,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      adults: params.passengers || 1,
      travelClass: params.cabinClass || 'ECONOMY',
      max: 50,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return response.data.map((offer: any) => normalizeFlightData(offer));
  } catch (error) {
    console.error('Amadeus search error:', error);
    return [];
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeFlightData(offer: any): NormalizedFlight {
  const itinerary = offer.itineraries[0];
  const segment = itinerary.segments[0];
  
  // Extract amenities from segment
  const amenities = segment.amenities || [];
  
  // Calculate total duration in ISO 8601 format
  const duration = itinerary.duration;
  
  return {
    id: offer.id,
    carrier: segment.carrierCode,
    carrierLogo: `https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/${segment.carrierCode}.svg`,
    flightNumber: `${segment.carrierCode}${segment.number}`,
    origin: segment.departure.iataCode,
    originName: segment.departure.iataCode, // Amadeus doesn't always provide city name
    destination: segment.arrival.iataCode,
    destinationName: segment.arrival.iataCode,
    departure: segment.departure.at,
    arrival: segment.arrival.at,
    duration: duration,
    price: parseFloat(offer.price.total),
    currency: offer.price.currency,
    cabinClass: segment.cabin || 'Economy',
    stops: itinerary.segments.length - 1,
    apiSource: 'amadeus',
    amenities: {
      wifi: amenities.some((a: any) => a.amenityType === 'WIFI' || a.isChargeable === false && a.description?.toLowerCase().includes('wifi')),
      power: amenities.some((a: any) => a.amenityType === 'POWER' || a.description?.toLowerCase().includes('usb') || a.description?.toLowerCase().includes('power')),
      entertainment: amenities.some((a: any) => a.amenityType === 'ENTERTAINMENT' || a.description?.toLowerCase().includes('entertainment') || a.description?.toLowerCase().includes('video')),
      meals: amenities.some((a: any) => a.amenityType === 'FOOD' || a.amenityType === 'BEVERAGE' || a.description?.toLowerCase().includes('meal')),
    },
    rawData: offer,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function bookFlight(offerId: string, travelers: any[]): Promise<any> {
  try {
    // First, price the offer to confirm it's still available
    const pricedOffer = await amadeus.shopping.flightOffers.pricing.post(
      JSON.stringify({
        data: {
          type: 'flight-offers-pricing',
          flightOffers: [offerId],
        },
      })
    );

    // Create the flight order
    const order = await amadeus.booking.flightOrders.post(
      JSON.stringify({
        data: {
          type: 'flight-order',
          flightOffers: pricedOffer.data.flightOffers,
          travelers: travelers,
        },
      })
    );

    return {
      success: true,
      bookingReference: order.data.associatedRecords[0]?.reference,
      order: order.data,
    };
  } catch (error) {
    console.error('Amadeus booking error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Booking failed',
    };
  }
}
