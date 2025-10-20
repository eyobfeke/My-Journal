// script.js
// Calendar, theme toggle, and 4-week aggregation

// ----- Theme toggle -----
const themeToggle = document.getElementById('theme-toggle');
const savedTheme = localStorage.getItem('theme') || 'dark';
if(savedTheme === 'light') document.body.classList.add('light');
themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
themeToggle.addEventListener('click', () => {
  const light = document.body.classList.toggle('light');
  localStorage.setItem('theme', light ? 'light' : 'dark');
  themeToggle.textContent = light ? '🌙' : '☀️';
});

// ----- Calendar generation -----
const calendarGrid = document.getElementById('calendar-grid');
const monthTitle = document.getElementById('month-title');
const prevBtn = document.getElementById('prev-month');
const nextBtn = document.getElementById('next-month');

let current = new Date();
let viewMonth = current.getMonth();
let viewYear = current.getFullYear();

function pad(n){return String(n).padStart(2,'0')}

function renderCalendar(month, year){
  calendarGrid.innerHTML = '';
  const first = new Date(year, month, 1).getDay(); // 0..6 (Sun..Sat)
  const total = new Date(year, month+1, 0).getDate();
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  monthTitle.textContent = `${monthNames[month]} ${year}`;

  // labels row (days)
  const labels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  labels.forEach(l => {
    const el = document.createElement('div');
    el.className = 'day-cell';
    el.style.minHeight = '28px';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.fontWeight = '700';
    el.textContent = l;
    calendarGrid.appendChild(el);
  });

  // create blanks to align first day: but we want to show proper calendar (we can fill leading empty days)
  const start = new Date(year, month, 1).getDay();
  for(let i=0;i<start;i++){
    const blank = document.createElement('div');
    blank.className = 'day-cell';
    blank.style.opacity = '0.4';
    calendarGrid.appendChild(blank);
  }

  for(let d=1; d<=total; d++){
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    const num = document.createElement('div');
    num.className = 'day-number';
    num.textContent = d;
    const entryList = document.createElement('div');
    entryList.className = 'day-entry-list';

    // Quick preview: show number of saved trades on that date
    const dateKey = `${year}-${pad(month+1)}-${pad(d)}`;
    const saved = localStorage.getItem(`entry-${dateKey}`);
    if(saved){
      try{
        const data = JSON.parse(saved);
        let trades = [];
        if(Array.isArray(data.trades)) trades = data.trades;
        else if(data.trades) trades = data.trades;
        // fallback: if single fields exist, count one
        const count = trades.length || (data['reflection-text'] || data['reflection'] || '') ? 1 : 1;
        entryList.textContent = `${count} entry${count>1?'s':''}`;
      }catch(e){}
    } else {
      entryList.textContent = '';
    }

    cell.appendChild(num);
    cell.appendChild(entryList);

    // click to open day page with date param
    cell.addEventListener('click', ()=> {
      const dateStr = `${year}-${pad(month+1)}-${pad(d)}`;
      window.location.href = `entries/day.html?date=${dateStr}`;
    });

    calendarGrid.appendChild(cell);
  }

  // after grid built, update summaries aggregation for this month
  aggregateFourWeeks(month, year);
}

prevBtn.addEventListener('click', ()=> {
  viewMonth--;
  if(viewMonth<0){viewMonth=11; viewYear--;}
  renderCalendar(viewMonth, viewYear);
});
nextBtn.addEventListener('click', ()=> {
  viewMonth++;
  if(viewMonth>11){viewMonth=0; viewYear++;}
  renderCalendar(viewMonth, viewYear);
});

renderCalendar(viewMonth, viewYear);


// ----- Weekly aggregation (4 blocks of the month) -----
function aggregateFourWeeks(month, year){
  // reset
  const weekStats = [
    {wins:0,loss:0,ongoing:0,pnl:0, trades:0},
    {wins:0,loss:0,ongoing:0,pnl:0, trades:0},
    {wins:0,loss:0,ongoing:0,pnl:0, trades:0},
    {wins:0,loss:0,ongoing:0,pnl:0, trades:0}
  ];

  const totalDays = new Date(year, month+1, 0).getDate();
  for(let d=1; d<=totalDays; d++){
    const dateKey = `${year}-${pad(month+1)}-${pad(d)}`;
    const raw = localStorage.getItem(`entry-${dateKey}`);
    if(!raw) continue;
    try{
      const obj = JSON.parse(raw);
      // support two shapes:
      // 1) obj.trades = [ {entry, exit, rr, note, pair, img, pnl?}, ... ]
      // 2) older single-entry shape: fields named e.g. entry, exit, pnl etc.
      let trades = [];
      if(Array.isArray(obj.trades)) trades = obj.trades;
      else {
        // create single trade from legacy fields if present
        const possible = ['entry','exit','rr','valid-note','pair'];
        const has = possible.some(k => Object.prototype.hasOwnProperty.call(obj,k) && obj[k]);
        if(has) trades.push({
          entry: obj.entry||'',
          exit: obj.exit||'',
          rr: obj.rr||'',
          note: obj['valid-note']||obj['setup-notes']||'',
          pair: obj.pair||''
        });
      }

      trades.forEach(t => {
        // determine pnl if possible
        let pnl = 0;
        const e = parseFloat(t.entry);
        const x = parseFloat(t.exit);
        if(!isNaN(e) && !isNaN(x)) pnl = +(x - e).toFixed(2);
        // if exit empty -> ongoing
        const ongoing = (t.exit === "" || t.exit === undefined) ? 1 : 0;
        // decide win / loss
        const win = (!ongoing && pnl>0) ? 1 : 0;
        const loss = (!ongoing && pnl<0) ? 1 : 0;

        // decide which week bucket
        const wkIndex = (d<=7)?0: (d<=14)?1: (d<=21)?2:3;
        weekStats[wkIndex].wins += win;
        weekStats[wkIndex].loss += loss;
        weekStats[wkIndex].ongoing += ongoing;
        weekStats[wkIndex].pnl += pnl;
        weekStats[wkIndex].trades += 1;
      });

    } catch(e){}
  }

  // write into table cells
  for(let i=0;i<4;i++){
    const w = weekStats[i];
    const winCell = document.getElementById(`w${i+1}-wins`);
    const lossCell = document.getElementById(`w${i+1}-loss`);
    const onCell = document.getElementById(`w${i+1}-ongoing`);
    const pnlCell = document.getElementById(`w${i+1}-pnl`);
    const rateCell = document.getElementById(`w${i+1}-rate`);

    if(winCell) winCell.textContent = w.wins;
    if(lossCell) lossCell.textContent = w.loss;
    if(onCell) onCell.textContent = w.ongoing;
    if(pnlCell) pnlCell.textContent = w.pnl.toFixed(2);
    const totalDecided = w.wins + w.loss;
    const rate = totalDecided === 0 ? 0 : Math.round((w.wins / totalDecided) * 100);
    if(rateCell) rateCell.textContent = `${rate}%`;
  }
}
