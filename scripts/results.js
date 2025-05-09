const params = new URLSearchParams(location.search);

/* ------------------ Configuration ------------------ */
const API_HOST = 'priceline-com2.p.rapidapi.com';
const API_KEY  = '847b58fb4amshdc9c4de8b218993p1c16dbjsnfa8c202c29bd';

/* ------------------ Helpers ------------------ */
const qs = (id) => document.getElementById(id);

function formatCurrency(n) {
  return Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

/* ------------------ Fetch data ------------------ */
async function fetchCars() {
  const url =
    `https://${API_HOST}/cars/search` +
    `?pickUpLocation=${params.get('pickUpLocation')}` +
    `&dropOffLocation=${params.get('dropOffLocation')}` +
    `&pickUpDate=${params.get('pickUpDate')}` +
    `&pickUpTime=${params.get('pickUpTime')}` +
    `&dropOffDate=${params.get('dropOffDate')}` +
    `&dropOffTime=${params.get('dropOffTime')}`;

  const res = await fetch(url, {
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': API_HOST
    }
  });

  if (!res.ok) throw new Error(`API request failed: ${res.status}`);

  const data = await res.json();

  // Priceline response shape: data.cars.results
  return data?.cars?.results ?? [];
}

/* ------------------ Render logic ------------------ */
let carData = [];
const resultsContainer = qs('resultsContainer');

function renderCards(list) {
  resultsContainer.innerHTML = '';

  if (!list.length) {
    resultsContainer.textContent = 'No cars match your criteria.';
    return;
  }

  list.forEach((car) => {
    const card = document.createElement('article');
    card.className = 'result-card';

    const imageUrl =
      car.imageUrl ||
      'https://placehold.co/96x64/png?text=Car';

    card.innerHTML = `
      <img src="${imageUrl}" alt="" />
      <div style="flex:1">
        <h3>${car.vehicleExample || car.vehicleClass || 'Vehicle'}</h3>
        <p>${car.company?.name || car.vendorName}</p>
        <p><strong>${formatCurrency(car.totalPrice?.value || car.totalCharge?.rateTotalAmount)}</strong></p>
        <a href="${car.deepLink || '#'}" target="_blank" class="button">Book →</a>
      </div>
    `;
    resultsContainer.appendChild(card);
  });
}

/* ------------------ Filters ------------------ */
function populateFilters() {
  const companies = new Set(carData.map((c) => c.company?.name || c.vendorName));
  const states    = new Set(carData.map((c) => c.pickUpLocation?.stateProvCode || '')); // may be empty

  companies.forEach((name) => {
    if (!name) return;
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    qs('companyFilter').appendChild(opt);
  });

  states.forEach((st) => {
    if (!st) return;
    const opt = document.createElement('option');
    opt.value = st;
    opt.textContent = st;
    qs('stateFilter').appendChild(opt);
  });
}

function applyFiltersAndSort() {
  const company = qs('companyFilter').value;
  const state   = qs('stateFilter').value;
  const sortDir = qs('sortSelect').value;

  let filtered = [...carData];

  if (company !== 'all') {
    filtered = filtered.filter((c) => (c.company?.name || c.vendorName) === company);
  }
  if (state !== 'all') {
    filtered = filtered.filter((c) => c.pickUpLocation?.stateProvCode === state);
  }

  filtered.sort((a, b) => {
    const priceA = a.totalPrice?.value || a.totalCharge?.rateTotalAmount;
    const priceB = b.totalPrice?.value || b.totalCharge?.rateTotalAmount;
    return sortDir === 'asc' ? priceA - priceB : priceB - priceA;
  });

  renderCards(filtered);
}

/* ------------------ Map ------------------ */
let map, markers = [];

function setupMap(list) {
  if (!list.length) return;

  const [first] = list;
  const lat = first.pickUpLocation?.latitude  || 40.0;
  const lng = first.pickUpLocation?.longitude || -95.0;

  map = L.map('map').setView([lat, lng], 4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);

  list.forEach((car) => {
    const { latitude, longitude, city } = car.pickUpLocation || {};
    if (!latitude || !longitude) return;

    const marker = L.marker([latitude, longitude]).addTo(map);
    marker.bindPopup(
      `<strong>${car.company?.name || car.vendorName}</strong><br>${car.vehicleExample || car.vehicleClass}<br>${formatCurrency(car.totalPrice?.value || car.totalCharge?.rateTotalAmount)}`
    );
    markers.push(marker);
  });
}

/* ------------------ Main ------------------ */
(async () => {
  try {
    carData = await fetchCars();

    /* Filter by vehicle type (client‑side) */
    const vehicleType = params.get('vehicleType');
    if (vehicleType && vehicleType !== 'any') {
      carData = carData.filter((c) =>
        (c.vehicleClass || '').toLowerCase().includes(vehicleType)
      );
    }

    populateFilters();
    applyFiltersAndSort();
    setupMap(carData);

    /* Attach filter listeners */
    ['companyFilter', 'stateFilter', 'sortSelect'].forEach((id) =>
      qs(id).addEventListener('change', applyFiltersAndSort)
    );
  } catch (err) {
    resultsContainer.innerHTML = `<p class="error">Error: ${err.message}</p>`;
    console.error(err);
  }
})();
