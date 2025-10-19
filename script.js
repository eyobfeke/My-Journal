const calendarGrid = document.getElementById("calendar-grid");
const today = new Date();
const year = today.getFullYear();
const month = today.getMonth();
const daysInMonth = new Date(year, month + 1, 0).getDate();

for (let day = 1; day <= daysInMonth; day++) {
  const date = new Date(year, month, day);
  const dayEl = document.createElement("div");
  dayEl.classList.add("day");
  dayEl.textContent = day;
  const dateString = date.toISOString().split("T")[0];
  dayEl.addEventListener("click", () => {
    window.location.href = `entries/${dateString}.html`;
  });
  calendarGrid.appendChild(dayEl);
}
