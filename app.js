const grid = document.querySelector('#calendarGrid');
const dialog = document.querySelector('#eventDialog');
const form = document.querySelector('#eventForm');
const titleInput = document.querySelector('#eventTitle');
const colorInput = document.querySelector('#eventColor');
const dialogDate = document.querySelector('#dialogDate');
const savedEvents = document.querySelector('#savedEvents');
const closeDialog = document.querySelector('#closeDialog');
const cancelButton = document.querySelector('#cancelButton');
const saveButton = document.querySelector('#saveButton');
const historyDialog = document.querySelector('#historyDialog');
const historyMonthSelect = document.querySelector('#historyMonthSelect');
let selectedDate = '';
let activeMonthOffset = 0;
let historyMonthKey = null;
let editingIndex = -1;
const weekdays = ['일','월','화','수','목','금','토'];
const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

function localDateKey(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
function readEvents() { try { return JSON.parse(localStorage.getItem('daily-plans') || '{}'); } catch { return {}; } }
function monthKey(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`; }
function dateFromMonthKey(key) { const [year, month] = key.split('-').map(Number); return new Date(year, month - 1, 1); }
function readMonthlyMemos() { try { return JSON.parse(localStorage.getItem('daily-plans-monthly-memos') || '{}'); } catch { return {}; } }
function saveMonthlyMemo(key, value) { const memos = readMonthlyMemos(); memos[key] = value; localStorage.setItem('daily-plans-monthly-memos', JSON.stringify(memos)); }
function monthDate(now, offset) { return new Date(now.getFullYear(), now.getMonth() + offset, 1); }
function addEmptyDays(container, count, className = 'day empty') {
  for (let blank = 0; blank < count; blank++) {
    const emptyDay = document.createElement('span');
    emptyDay.className = className;
    container.append(emptyDay);
  }
}
function createMainMonth(first, events, now, heading = '이번 달 일정') {
  const year = first.getFullYear(), month = first.getMonth(), total = new Date(year, month + 1, 0).getDate();
  const monthEl = document.createElement('section'); monthEl.className = 'month main-month';
  monthEl.innerHTML = `<div class="month-header"><div><p class="eyebrow">${heading}</p><h2>${monthNames[month]} <span>${year}</span></h2></div></div><div class="weekdays">${weekdays.map(x => `<span>${x}</span>`).join('')}</div><div class="days"></div>`;
  const days = monthEl.querySelector('.days'); addEmptyDays(days, first.getDay());
  for (let day = 1; day <= total; day++) {
    const date = new Date(year, month, day), key = localDateKey(date), item = document.createElement('button');
    item.type = 'button'; item.className = `day ${date.getDay()===0 || date.getDay()===6 ? 'weekend':''} ${key===localDateKey(now)?'today':''}`;
    item.setAttribute('aria-label', `${year}년 ${month+1}월 ${day}일 일정 보기`);
    const dayEvents = events[key] || [];
    const visibleEvents = dayEvents.slice(0, 3).map(e => `<div class="event ${e.color}" title="${escapeHtml(e.title)}">${escapeHtml(e.title)}</div>`).join('');
    const more = dayEvents.length > 3 ? `<div class="more-events">+${dayEvents.length - 3}개 더</div>` : '';
    item.innerHTML = `<span class="date-number">${day}</span><div class="events-preview">${visibleEvents}${more}</div>`;
    item.addEventListener('click', () => openDialog(key)); days.append(item);
  }
  return monthEl;
}
function createPreview(first, events, onSelect) {
  const year = first.getFullYear(), month = first.getMonth(), total = new Date(year, month + 1, 0).getDate();
  const card = document.createElement('button'); card.type = 'button'; card.className = 'month-preview';
  card.innerHTML = `<span class="preview-title"><strong>${monthNames[month]}</strong><small>${year}</small></span><span class="mini-weekdays">${weekdays.map(x => `<i>${x}</i>`).join('')}</span><span class="mini-days"></span><span class="open-month">월 일정 보기 →</span>`;
  const days = card.querySelector('.mini-days'); addEmptyDays(days, first.getDay(), 'mini-day empty');
  for (let day = 1; day <= total; day++) {
    const key = localDateKey(new Date(year, month, day)); const dayEl = document.createElement('span'); dayEl.className = 'mini-day';
    dayEl.innerHTML = `${day}${events[key]?.length ? '<b></b>' : ''}`; days.append(dayEl);
  }
  card.addEventListener('click', () => { onSelect(); render(); grid.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  return card;
}
function render() {
  const now = new Date(); now.setHours(0,0,0,0);
  const events = readEvents();
  document.querySelector('#todayText').textContent = `오늘은 ${now.getFullYear()}년 ${now.getMonth()+1}월 ${now.getDate()}일 ${weekdays[now.getDay()]}요일`;
  const todayEvents = events[localDateKey(now)] || [];
  document.querySelector('#todaySchedule').innerHTML = todayEvents.length
    ? todayEvents.map(event => `<span class="today-event ${event.color}">${escapeHtml(event.title)}</span>`).join('')
    : '<span class="no-schedule">오늘 등록된 일정이 없습니다.</span>';
  const displayedMonth = historyMonthKey ? dateFromMonthKey(historyMonthKey) : monthDate(now, activeMonthOffset);
  const isHistory = Boolean(historyMonthKey);
  document.querySelector('#rangeLabel').textContent = isHistory ? `${displayedMonth.getFullYear()}년 ${monthNames[displayedMonth.getMonth()]} 지난 일정` : `${monthNames[now.getMonth()]}부터 3개월 일정 보기`;
  grid.innerHTML = '';
  grid.append(createMainMonth(displayedMonth, events, now, isHistory ? '지난 일정' : '이번 달 일정'));
  const previews = document.createElement('aside'); previews.className = 'month-previews';
  if (isHistory) {
    for (let offset = 0; offset < 3; offset++) previews.append(createPreview(monthDate(now, offset), events, () => { historyMonthKey = null; activeMonthOffset = offset; }));
  } else {
    for (let offset = 0; offset < 3; offset++) if (offset !== activeMonthOffset) previews.append(createPreview(monthDate(now, offset), events, () => { activeMonthOffset = offset; }));
  }
  const generalMemo = document.createElement('section'); generalMemo.className = 'memo-card';
  generalMemo.innerHTML = `<p class="eyebrow">일반 메모</p><textarea id="generalMemo" maxlength="500" placeholder="달력과 관계없이 유지되는 메모입니다."></textarea>`;
  const generalMemoInput = generalMemo.querySelector('#generalMemo');
  generalMemoInput.value = localStorage.getItem('daily-plans-memo') || '';
  generalMemoInput.addEventListener('input', () => localStorage.setItem('daily-plans-memo', generalMemoInput.value));
  const monthlyMemo = document.createElement('section'); monthlyMemo.className = 'memo-card monthly-memo-card';
  const selectedMonthKey = monthKey(displayedMonth);
  monthlyMemo.innerHTML = `<p class="eyebrow">월별 메모</p><h2>${displayedMonth.getFullYear()}년 ${monthNames[displayedMonth.getMonth()]}</h2><textarea id="monthlyMemo" maxlength="500" placeholder="이 달에만 저장되는 메모입니다."></textarea>`;
  const monthlyMemoInput = monthlyMemo.querySelector('#monthlyMemo');
  monthlyMemoInput.value = readMonthlyMemos()[selectedMonthKey] || '';
  monthlyMemoInput.addEventListener('input', () => saveMonthlyMemo(selectedMonthKey, monthlyMemoInput.value));
  previews.append(generalMemo, monthlyMemo);
  grid.append(previews);
}
function escapeHtml(text) { const el=document.createElement('span'); el.textContent=text; return el.innerHTML; }
function renderSelectedEvents() {
  const schedules = readEvents()[selectedDate] || [];
  savedEvents.innerHTML = schedules.length ? `<h3>등록된 일정</h3>${schedules.map((event, index) => `<div class="saved-event ${event.color}"><span class="event ${event.color}">${escapeHtml(event.title)}</span><span class="event-actions"><button class="edit-event" type="button" data-index="${index}" aria-label="${escapeHtml(event.title)} 수정">✎</button><button class="delete-event" type="button" data-index="${index}" aria-label="${escapeHtml(event.title)} 삭제">×</button></span></div>`).join('')}` : '';
  savedEvents.querySelectorAll('.edit-event').forEach(button => button.addEventListener('click', () => {
    const event = readEvents()[selectedDate][Number(button.dataset.index)];
    editingIndex = Number(button.dataset.index);
    titleInput.value = event.title; colorInput.value = event.color;
    saveButton.textContent = '수정 저장'; titleInput.focus();
  }));
  savedEvents.querySelectorAll('.delete-event').forEach(button => button.addEventListener('click', () => {
    const events = readEvents();
    events[selectedDate].splice(Number(button.dataset.index), 1);
    if (!events[selectedDate].length) delete events[selectedDate];
    localStorage.setItem('daily-plans', JSON.stringify(events));
    editingIndex = -1; titleInput.value = ''; saveButton.textContent = '저장';
    renderSelectedEvents(); render();
  }));
}
function openDialog(key) { selectedDate=key; editingIndex=-1; const [y,m,d]=key.split('-').map(Number); dialogDate.textContent=`${y}년 ${m}월 ${d}일`; titleInput.value=''; colorInput.value='violet'; saveButton.textContent='저장'; renderSelectedEvents(); dialog.showModal(); titleInput.focus(); }
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!titleInput.value.trim()) return;
  const events=readEvents();
  const schedule = {title:titleInput.value.trim(),color:colorInput.value};
  if (editingIndex >= 0) events[selectedDate][editingIndex] = schedule;
  else (events[selectedDate] ||= []).push(schedule);
  localStorage.setItem('daily-plans',JSON.stringify(events));
  dialog.close(); render();
});
closeDialog.addEventListener('click', () => dialog.close());
cancelButton.addEventListener('click', () => dialog.close());
document.querySelector('#todayButton').addEventListener('click',()=>{ historyMonthKey = null; activeMonthOffset = 0; render(); document.querySelector('.today')?.scrollIntoView({behavior:'smooth',block:'center'}); });
function showHistoryPicker() {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const currentKey = monthKey(now);
  const keys = new Set();
  for (let offset = 1; offset <= 24; offset++) keys.add(monthKey(monthDate(now, -offset)));
  Object.keys(readEvents()).forEach(key => { const match = key.match(/^\d{4}-\d{2}/); if (match && match[0] < currentKey) keys.add(match[0]); });
  Object.keys(readMonthlyMemos()).forEach(key => { if (key < currentKey) keys.add(key); });
  historyMonthSelect.innerHTML = [...keys].sort().reverse().map(key => { const date = dateFromMonthKey(key); return `<option value="${key}">${date.getFullYear()}년 ${monthNames[date.getMonth()]}</option>`; }).join('');
  historyDialog.showModal();
}
document.querySelector('#historyButton').addEventListener('click', showHistoryPicker);
document.querySelector('#openHistoryButton').addEventListener('click', () => { historyMonthKey = historyMonthSelect.value; activeMonthOffset = 0; historyDialog.close(); render(); grid.scrollIntoView({ behavior:'smooth', block:'start' }); });
render();
// 앱을 자정 넘어서 계속 열어 둔 경우에도 보이는 3개월을 갱신한다.
setTimeout(() => { render(); setInterval(render, 86400000); }, new Date().setHours(24,0,1,0) - Date.now());
