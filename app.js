const grid = document.querySelector('#calendarGrid');
const dialog = document.querySelector('#eventDialog');
const form = document.querySelector('#eventForm');
const titleInput = document.querySelector('#eventTitle');
const colorInput = document.querySelector('#eventColor');
const dialogDate = document.querySelector('#dialogDate');
const closeDialog = document.querySelector('#closeDialog');
const cancelButton = document.querySelector('#cancelButton');
let selectedDate = '';
const weekdays = ['일','월','화','수','목','금','토'];
const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

function localDateKey(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
function readEvents() { try { return JSON.parse(localStorage.getItem('daily-plans') || '{}'); } catch { return {}; } }
function render() {
  const now = new Date(); now.setHours(0,0,0,0);
  document.querySelector('#todayText').textContent = `오늘은 ${now.getFullYear()}년 ${now.getMonth()+1}월 ${now.getDate()}일 ${weekdays[now.getDay()]}요일`;
  document.querySelector('#rangeLabel').textContent = `${monthNames[now.getMonth()]}부터 3개월 일정 보기`;
  const events = readEvents(); grid.innerHTML = '';
  for (let offset=0; offset<3; offset++) {
    const first = new Date(now.getFullYear(), now.getMonth()+offset, 1);
    const year = first.getFullYear(), month = first.getMonth(), total = new Date(year,month+1,0).getDate();
    const monthEl = document.createElement('section'); monthEl.className='month';
    monthEl.innerHTML = `<div class="month-header"><h2>${monthNames[month]}</h2><span>${year}</span></div><div class="weekdays">${weekdays.map(x=>`<span>${x}</span>`).join('')}</div><div class="days"></div>`;
    const days = monthEl.querySelector('.days');
    for (let blank=0; blank<first.getDay(); blank++) {
      const emptyDay = document.createElement('span');
      emptyDay.className = 'day empty';
      days.append(emptyDay);
    }
    for(let day=1; day<=total; day++) {
      const date = new Date(year,month,day), key=localDateKey(date), item=document.createElement('button');
      item.type='button'; item.className=`day ${date.getDay()===0 || date.getDay()===6 ? 'weekend':''} ${key===localDateKey(now)?'today':''}`;
      item.dataset.date=key; item.setAttribute('aria-label', `${year}년 ${month+1}월 ${day}일 일정 추가`);
      item.innerHTML=`<span class="date-number">${day}</span>${(events[key]||[]).map(e=>`<div class="event ${e.color}" title="${escapeHtml(e.title)}">${escapeHtml(e.title)}</div>`).join('')}`;
      item.addEventListener('click', () => openDialog(key)); days.append(item);
    } grid.append(monthEl);
  }
}
function escapeHtml(text) { const el=document.createElement('span'); el.textContent=text; return el.innerHTML; }
function openDialog(key) { selectedDate=key; const [y,m,d]=key.split('-').map(Number); dialogDate.textContent=`${y}년 ${m}월 ${d}일`; titleInput.value=''; colorInput.value='violet'; dialog.showModal(); titleInput.focus(); }
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!titleInput.value.trim()) return;
  const events=readEvents();
  (events[selectedDate] ||= []).push({title:titleInput.value.trim(),color:colorInput.value});
  localStorage.setItem('daily-plans',JSON.stringify(events));
  dialog.close(); render();
});
closeDialog.addEventListener('click', () => dialog.close());
cancelButton.addEventListener('click', () => dialog.close());
document.querySelector('#todayButton').addEventListener('click',()=>document.querySelector('.today')?.scrollIntoView({behavior:'smooth',block:'center'}));
render();
// 앱을 자정 넘어서 계속 열어 둔 경우에도 보이는 3개월을 갱신한다.
setTimeout(() => { render(); setInterval(render, 86400000); }, new Date().setHours(24,0,1,0) - Date.now());
