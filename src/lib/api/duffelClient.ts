import { Duffel } from '@duffel/api';

const duffel = new Duffel({
  token: process.env.DUFFEL_API_KEY!,
});

export interface NormalizedFlight {
  id: string;
  carrier: string;
  carrierLogo?: string;
  flightNumber: string;
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  currency: string;
  cabinClass: string;
  stops: number;
  apiSource: 'duffel' | 'amadeus';
  amenities?: {
    wifi?: boolean;
    power?: boolean;
    entertainment?: boolean;
    meals?: boolean;
  };
  baggage?: {
    carryOn?: {
      quantity: number;
      weight?: string;
    };
    checked?: {
      quantity: number;
      weight?: string;
    };
  };
  // All fare options for this flight route (same route, different fares)
  fareOptions?: NormalizedFlight[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawData: any;
}

interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers?: number;
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
}

export async function searchFlights(params: SearchParams): Promise<NormalizedFlight[]> {
  try {
    const offerRequest = await duffel.offerRequests.create({
      slices: [
        {
          origin: params.origin,
          destination: params.destination,
          departure_date: params.departureDate,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        ...(params.returnDate ? [{
          origin: params.destination,
          destination: params.origin,
          departure_date: params.returnDate,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any] : []),
      ],
      passengers: [
        { type: 'adult' as const },
        ...(params.passengers && params.passengers > 1 
          ? Array(params.passengers - 1).fill({ type: 'adult' as const }) 
          : []
        ),
      ],
      // Don't specify cabin_class to get offers for ALL cabin classes
      // This allows us to show economy, premium economy, business options
      // cabin_class: params.cabinClass || 'economy',
      return_offers: params.returnDate ? true : false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Get offers from the offer request
    const offers = await duffel.offers.list({
      offer_request_id: offerRequest.data.id,
      sort: 'total_amount',
    });

    return offers.data.map(offer => normalizeFlightData(offer));
  } catch (error) {
    console.error('Duffel search error:', error);
    return [];
  }
}

/**
 * Normalize cabin class to standardized lowercase format
 */
function normalizeCabinClass(cabinClass: string): string {
  const normalized = cabinClass.toLowerCase().trim();
  
  // Map marketing names to standard cabin classes
  if (normalized.includes('business') || normalized.includes('polaris') || normalized.includes('flagship')) {
    return 'business';
  }
  if (normalized.includes('premium') || normalized.includes('comfort')) {
    return 'premium_economy';
  }
  if (normalized.includes('first')) {
    return 'first';
  }
  // Default to economy for basic/main/economy
  return 'economy';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeFlightData(offer: any): NormalizedFlight {
  const slice = offer.slices[0];
  const segment = slice.segments[0];
  
  // Extract amenities from the first passenger's cabin (if available)
  const cabin = segment.passengers?.[0]?.cabin;
  const amenities = cabin?.amenities || [];
  const amenitiesArray = Array.isArray(amenities) ? amenities : [];
  
  // Log to see what amenities we're getting
  console.log('Duffel flight amenities data:', {
    hasPassengers: !!segment.passengers,
    hasCabin: !!cabin,
    amenitiesType: typeof amenities,
    amenitiesLength: amenitiesArray.length,
    amenitiesSample: amenitiesArray[0]
  });
  
  // Extract baggage allowances
  const passengerBaggages = segment.passengers?.[0]?.baggages || [];
  const carryOnBag = passengerBaggages.find((b: any) => b.type === 'carry_on');
  const checkedBag = passengerBaggages.find((b: any) => b.type === 'checked');
  
  // Normalize cabin class to lowercase standard format
  const rawCabinClass = segment.passengers[0]?.cabin_class || segment.passengers[0]?.cabin_class_marketing_name || 'economy';
  const normalizedCabinClass = normalizeCabinClass(rawCabinClass);
  
  // Log cabin class info for debugging
  console.log(`Duffel offer ${offer.id}: raw="${rawCabinClass}" → normalized="${normalizedCabinClass}"`);
  
  return {
    id: offer.id,
    carrier: segment.marketing_carrier.name,
    carrierLogo: segment.marketing_carrier.logo_symbol_url,
    flightNumber: `${segment.marketing_carrier.iata_code}${segment.marketing_carrier_flight_number}`,
    origin: segment.origin.iata_code,
    originName: segment.origin.city_name || segment.origin.name,
    destination: segment.destination.iata_code,
    destinationName: segment.destination.city_name || segment.destination.name,
    departure: segment.departing_at,
    arrival: segment.arriving_at,
    duration: slice.duration,
    price: parseFloat(offer.total_amount),
    currency: offer.total_currency,
    cabinClass: normalizedCabinClass,
    stops: slice.segments.length - 1,
    apiSource: 'duffel',
    amenities: amenitiesArray.length > 0 ? {
      wifi: amenitiesArray.some((a: any) => a.type === 'wifi'),
      power: amenitiesArray.some((a: any) => a.type === 'power' || a.type === 'usb_power'),
      entertainment: amenitiesArray.some((a: any) => a.type === 'video' || a.type === 'audio'),
      meals: amenitiesArray.some((a: any) => a.type === 'food' || a.type === 'beverage'),
    } : {
      // For now, add some default amenities based on cabin class for display purposes
      wifi: segment.passengers[0]?.cabin_class_marketing_name !== 'Economy',
      power: true,
      entertainment: true,
      meals: segment.passengers[0]?.cabin_class_marketing_name !== 'Economy',
    },
    baggage: {
      carryOn: carryOnBag ? {
        quantity: carryOnBag.quantity || 1,
        weight: carryOnBag.weight ? `${carryOnBag.weight}kg` : undefined,
      } : { quantity: 1 },
      checked: checkedBag ? {
        quantity: checkedBag.quantity || 0,
        weight: checkedBag.weight ? `${checkedBag.weight}kg` : undefined,
      } : { quantity: 0 },
    },
    rawData: offer,
  };
}

export async function bookFlight(
  offerId: string, 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  passengers: any[]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  try {
    const order = await duffel.orders.create({
      type: 'instant' as const,
      selected_offers: [offerId],
      passengers: passengers,
      payments: [
        {
          type: 'balance' as const,
          amount: '0.00', // This would be the actual payment in production
          currency: 'USD',
        },
      ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    return {
      success: true,
      bookingReference: order.data.booking_reference,
      order: order.data,
    };
  } catch (error) {
    console.error('Duffel booking error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Booking failed',
    };
  }
}
