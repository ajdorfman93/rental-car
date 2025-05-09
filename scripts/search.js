/* scripts/scraper.js – writes data/rentals.json */
import { mkdir, writeFile } from 'fs/promises';

const {
  RAPIDAPI_KEY,
  PICKUP_LOCATION = 'JFK',
  DROPOFF_LOCATION = 'JFK',
  PICKUP_DATE  = '2025-06-01',
  PICKUP_TIME  = '10:00',
  DROPOFF_DATE = '2025-06-04',
  DROPOFF_TIME = '10:00',
  VEHICLE_TYPE = 'any'
} = process.env;

if (!RAPIDAPI_KEY) {
  console.error('RAPIDAPI_KEY secret missing');  process.exit(1);
}

const qs = new URLSearchParams({
  pickUpLocation: PICKUP_LOCATION,
  dropOffLocation: DROPOFF_LOCATION,
  pickUpDate: PICKUP_DATE,
  pickUpTime: PICKUP_TIME,
  dropOffDate: DROPOFF_DATE,
  dropOffTime: DROPOFF_TIME
});

const url = `https://priceline-com2.p.rapidapi.com/cars/search?${qs}`;

const res = await fetch(url, {
  headers: {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': 'priceline-com2.p.rapidapi.com'
  }
});

if (!res.ok) {
  console.error(`API error ${res.status}`); process.exit(1);
}

let cars = (await res.json())?.cars?.results ?? [];

if (VEHICLE_TYPE !== 'any') {
  cars = cars.filter(c =>
    (c.vehicleClass || '').toLowerCase().includes(VEHICLE_TYPE)
  );
}

await mkdir('data', { recursive: true });
await writeFile('data/rentals.json', JSON.stringify(cars, null, 2));

console.log(`Saved ${cars.length} cars to data/rentals.json`);
