/* scripts/scraper.js
   Fetches Priceline cars data → data/rentals.json
   Reads all query params from environment variables so the Action can override. */

import fetch from 'node-fetch';
import { mkdir, writeFile } from 'fs/promises';

const {
  PICKUP_LOCATION = 'JFK',
  DROPOFF_LOCATION = 'JFK',
  PICKUP_DATE     = '2025-06-01',
  PICKUP_TIME     = '10:00',
  DROPOFF_DATE    = '2025-06-04',
  DROPOFF_TIME    = '10:00',
  VEHICLE_TYPE    = 'any',     // compact, suv, truck, van, any
  RAPIDAPI_KEY
} = process.env;

if (!RAPIDAPI_KEY) {
  console.error('❌  RAPIDAPI_KEY env var is missing');
  process.exit(1);
}

const endpoint = 'https://priceline-com2.p.rapidapi.com/cars/search';
const qs = new URLSearchParams({
  pickUpLocation: PICKUP_LOCATION,
  dropOffLocation: DROPOFF_LOCATION,
  pickUpDate: PICKUP_DATE,
  pickUpTime: PICKUP_TIME,
  dropOffDate: DROPOFF_DATE,
  dropOffTime: DROPOFF_TIME
}).toString();

const url = `${endpoint}?${qs}`;

console.log(`➡️  Fetching Priceline data: ${url}`);

const res = await fetch(url, {
  headers: {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': 'priceline-com2.p.rapidapi.com'
  }
});

if (!res.ok) {
  console.error(`❌  API returned ${res.status}`);
  console.error(await res.text());
  process.exit(1);
}

let results = (await res.json())?.cars?.results ?? [];

if (VEHICLE_TYPE !== 'any') {
  results = results.filter(c =>
    (c.vehicleClass || '').toLowerCase().includes(VEHICLE_TYPE)
  );
}

await mkdir('data', { recursive: true });
await writeFile('data/rentals.json', JSON.stringify(results, null, 2));

console.log(`✅  Wrote ${results.length} items → data/rentals.json`);
