/* scripts/scraper.js – robust version  */
import { mkdir, writeFile } from 'fs/promises';

const {
  RAPIDAPI_KEY,
  PICKUP_LOCATION = 'JFK',
  DROPOFF_LOCATION = 'JFK',
  PICKUP_DATE  = '2025-06-01',
  PICKUP_TIME  = '10:00',
  DROPOFF_DATE = '2025-06-04',
  DROPOFF_TIME = '10:00',
  VEHICLE_TYPE = 'any',
  DRIVER_AGE   = '25'          // NEW — Priceline requires this
} = process.env;

if (!RAPIDAPI_KEY) {
  console.error('❌  RAPIDAPI_KEY secret missing');  process.exit(1);
}

/* ---------- Build query string ---------- */
const qs = new URLSearchParams({
  pickUpLocation : PICKUP_LOCATION,
  dropOffLocation: DROPOFF_LOCATION,
  pickUpDate     : PICKUP_DATE,
  pickUpTime     : PICKUP_TIME,
  dropOffDate    : DROPOFF_DATE,
  dropOffTime    : DROPOFF_TIME,
  driverAge      : DRIVER_AGE,       // ← REQUIRED
  currency       : 'USD'             // optional but nice
});

const url = `https://priceline-com2.p.rapidapi.com/cars/search?${qs}`;

/* ---------- Call API ---------- */
const res = await fetch(url, {
  headers: {
    'x-rapidapi-key' : RAPIDAPI_KEY,
    'x-rapidapi-host': 'priceline-com2.p.rapidapi.com'
  }
});

if (!res.ok) {
  console.error(`❌  API ${res.status} — ${res.statusText}`);
  console.error(await res.text());
  process.exit(1);
}

const json = await res.json();

/* ---------- Locate car array (three possible shapes) ---------- */
let cars =
      json?.cars?.results               // most common
  ||  json?.results?.cars
  ||  json?.results
  ||  [];

/* ---------- Filter & save ---------- */
if (VEHICLE_TYPE !== 'any') {
  cars = cars.filter(c =>
    (c.vehicleClass || '').toLowerCase().includes(VEHICLE_TYPE)
  );
}

/* Fallback: dump full JSON for debugging if still empty */
if (!cars.length) {
  await mkdir('data', { recursive: true });
  await writeFile('data/last‑raw‑response.json', JSON.stringify(json, null, 2));
  console.log('ℹ️  No car results — wrote data/last‑raw‑response.json for inspection.');
  process.exit(0);          // exit gracefully so workflow still “succeeds”
}

await mkdir('data', { recursive: true });
await writeFile('data/rentals.json', JSON.stringify(cars, null, 2));

console.log(`✅  Saved ${cars.length} cars → data/rentals.json`);
