import { majorAirports } from '@/constants/airports';

/**
 * Filter Duffel flight offers to only include flights from major commercial airports.
 * 
 * This function checks each flight offer's origin and destination airports and only
 * keeps offers where both airports are in the major airports list for their respective cities.
 * 
 * @param offers - Array of Duffel flight offers
 * @returns Filtered array containing only offers with major airport routes
 * 
 * @example
 * ```ts
 * const offers = await duffel.offers.list({ offer_request_id: requestId });
 * const filteredOffers = filterDuffelOffersByMajorAirports(offers.data);
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function filterDuffelOffersByMajorAirports(offers: any[]): any[] {
  return offers.filter((offer) => {
    // Check all slices in the offer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allSlicesValid = offer.slices?.every((slice: any) => {
      // Get the segments (flight legs)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return slice.segments?.every((segment: any) => {
        const originAirportCode = segment.origin?.iata_code;
        const destinationAirportCode = segment.destination?.iata_code;
        const originCityCode = segment.origin?.city?.iata_code || segment.origin?.iata_city_code;
        const destinationCityCode = segment.destination?.city?.iata_code || segment.destination?.iata_city_code;

        // If origin city is in our major airports list, check if the airport is allowed
        if (originCityCode && majorAirports[originCityCode]) {
          const allowedOriginAirports = majorAirports[originCityCode];
          if (!allowedOriginAirports.includes(originAirportCode)) {
            return false; // Origin airport not in allowed list for this city
          }
        }

        // If destination city is in our major airports list, check if the airport is allowed
        if (destinationCityCode && majorAirports[destinationCityCode]) {
          const allowedDestinationAirports = majorAirports[destinationCityCode];
          if (!allowedDestinationAirports.includes(destinationAirportCode)) {
            return false; // Destination airport not in allowed list for this city
          }
        }

        // If we reach here, either:
        // 1. Both airports are in the major airports list, OR
        // 2. One or both cities are not in the list (we don't filter those)
        return true;
      });
    });

    return allSlicesValid;
  });
}
