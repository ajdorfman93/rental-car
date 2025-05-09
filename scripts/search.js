/** Redirect to results page with query‑string parameters */
document.getElementById('searchForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const params = new URLSearchParams({
    vehicleType: document.getElementById('vehicleType').value,
    pickUpLocation: document.getElementById('pickUpLocation').value.trim().toUpperCase(),
    dropOffLocation: document.getElementById('dropOffLocation').value.trim().toUpperCase(),
    pickUpDate: document.getElementById('pickUpDate').value,
    pickUpTime: document.getElementById('pickUpTime').value,
    dropOffDate: document.getElementById('dropOffDate').value,
    dropOffTime: document.getElementById('dropOffTime').value,
    over25: document.getElementById('over25').checked ? '1' : '0'
  });

  location.href = `results.html?${params.toString()}`;
});
