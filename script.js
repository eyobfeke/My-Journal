// script.js

// === Calendar setup ===
const calendarGrid = document.getElementById("calendar-grid");
const today = new Date();
const month = today.getMonth();
const year = today.getFullYear();

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Create a header title for the month
const header = document.createElement("h3");
header.textContent = `${monthNames[month]} ${year}`;
calendarGrid.before(header);

// === Build Calendar Days ===
function buildCalendar() {
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Fill empty spaces before the 1st day
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.classList.add("empty");
    calendarGrid.appendChild(empty);
  }

  // Fill the calendar with days
  for (let d = 1; d <= totalDays; d++) {
    const day = document.createElement("div");
    day.classList.add("day");
    day.textContent = d;

    day.addEventListener("click", () => {
      const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      window.location.href = `entries/day.html?date=${dateString}`;
    });

    calendarGrid.appendChild(day);
  }
}

buildCalendar();
