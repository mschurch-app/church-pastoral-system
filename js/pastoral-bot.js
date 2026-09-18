// js/pastoral-bot.js
import { db, state } from './state.js';

export async function loadPastoralBotSettings() {
  try {
    const { data: churchInfo } = await db.from('churches').select('*').eq('id', state.activeChurch).maybeSingle();
    if (churchInfo) {
      document.getElementById('notifyPastorName').value = churchInfo.notify_pastor_name || '';
      document.getElementById('notifyPastorLineId').value = churchInfo.notify_pastor_line_id || '';
    }

    const { data: tpls } = await db.from('pastoral_templates').select('*').eq('church_id', state.activeChurch);
    state.cachedTemplates = tpls || [];
    renderTemplatesList();

    let { data: cards } = await db.from('spiritual_cards').select('*').eq('church_id', state.activeChurch);
    state.cachedCards = cards || [];
    renderCardsList();

    let { data: journeys } = await db.from('newcomer_journey_steps').select('*').eq('church_id', state.activeChurch).order('day_offset');
    state.cachedJourney = journeys || [];
    renderJourneyList();

    let { data: gcards } = await db.from('share_greeting_cards').select('*').eq('church_id', state.activeChurch).order('id', { ascending: false });
    state.cachedGreetingCards = gcards || [];
    filterGreetingCards(state.currentGreetingFilter);
  } catch(e) { console.error(e); }
}

window.switchBotSubTab = function(tab) {
  ['templates', 'cards', 'journey', 'images', 'newcomer-notify'].forEach(t => {
    const el = document.getElementById(`sub-${t}`);
    const btn = document.getElementById(`btn-sub-${t}`);
    if (el) el.classList.toggle('hidden', t !== tab);
    if (btn) btn.className = (t === tab) ? 'px-3.5 py-1.5 rounded-xl text-xs font-extrabold btn-warm' : 'px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-stone-600';
  });
  if (tab === 'cards') renderCardsList();
  if (tab === 'journey') renderJourneyList();
  if (tab === 'images') filterGreetingCards(state.currentGreetingFilter);
}

function renderTemplatesList() {
  const c = document.getElementById('templatesListContainer');
  if (!c) return;
  c.innerHTML = state.cachedTemplates.map(t => `
    <div class="lux-card p-5 space-y-3">
      <h3 class="font-black text-sm text-stone-800">${t.title}</h3>
      <textarea id="tpl-text-${t.id}" rows="3" class="w-full bg-stone-50 border rounded-xl p-3 text-xs leading-relaxed focus:outline-none">${t.content}</textarea>
      <div class="flex justify-end"><button onclick="saveTemplate(${t.id})" class="px-4 py-1.5 rounded-xl btn-warm text-xs font-bold">儲存</button></div>
    </div>
  `).join('') || `<div class="col-span-2 py-8 text-center text-stone-400 text-xs">目前無祝禱範本</div>`;
}

window.saveTemplate = async function(id) {
  const val = document.getElementById(`tpl-text-${id}`).value.trim();
  await db.from('pastoral_templates').update({ content: val }).eq('id', id);
  alert('✨ 祝禱範本已成功儲存！');
}

function renderCardsList() {
  const c = document.getElementById('cardsListContainer');
  if (!c) return;
  if (!state.cachedCards.length) { c.innerHTML = '<div class="col-span-2 text-center text-stone-400 py-12 text-xs">目前無金句卡</div>'; return; }
  c.innerHTML = state.cachedCards.map(card => `
    <div class="lux-card p-5 space-y-2.5 text-xs flex flex-col justify-between">
      <div class="space-y-1.5">
        <span class="px-2.5 py-0.5 rounded-lg bg-orange-100 text-orange-950 font-bold text-[10px]">${card.category}</span>
        <h4 class="font-black text-stone-800 text-sm">${card.scripture_ref || ''}</h4>
        <p class="text-stone-600 leading-relaxed">「${card.scripture || ''}」</p>
        ${card.prayer_text ? `<p class="text-stone-400 text-[11px] mt-1">祝禱：${card.prayer_text}</p>` : ''}
      </div>
      <div class="pt-2 border-t flex justify-end gap-1.5">
        <button onclick="editCard(${card.id})" class="px-3 py-1 rounded-xl bg-orange-50 text-orange-800 font-bold">編輯</button>
        <button onclick="deleteCard(${card.id})" class="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-600 font-bold"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

function renderJourneyList() {
  const c = document.getElementById('journeyListContainer');
  if (!c) return;
  if (!state.cachedJourney.length) {
    c.innerHTML = `<div class="py-12 text-center text-stone-400 text-xs">目前無新朋友旅程規劃</div>`;
    return;
  }
  c.innerHTML = state.cachedJourney.map(j => `
    <div class="lux-card p-4 flex justify-between items-center text-xs">
      <div>
        <span class="font-bold text-orange-800">第 ${j.day_offset || 1} 天：${j.title || '關懷問候'}</span>
        <p class="text-stone-600 mt-1">${j.message || ''}</p>
      </div>
      <div class="flex gap-1.5">
        <button onclick="editJourneyStep(${j.id})" class="px-3 py-1 rounded-xl bg-orange-50 text-orange-800 font-bold">編輯</button>
        <button onclick="deleteJourneyStep(${j.id})" class="px-2 py-1 rounded-xl bg-rose-50 text-rose-600"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

window.openNewCardModal = function() {
  document.getElementById('editCardId').value = '';
  document.getElementById('editCardRef').value = '';
  document.getElementById('editCardScripture').value = '';
  document.getElementById('editCardPrayer').value = '';
  document.getElementById('cardEditModal').classList.remove('hidden');
}

window.editCard = function(id) {
  const c = state.cachedCards.find(x => x.id === id);
  if (!c) return;
  document.getElementById('editCardId').value = c.id;
  document.getElementById('editCardCat').value = c.category;
  document.getElementById('editCardRef').value = c.scripture_ref || '';
  document.getElementById('editCardScripture').value = c.scripture || '';
  document.getElementById('editCardPrayer').value = c.prayer_text || '';
  document.getElementById('cardEditModal').classList.remove('hidden');
}

window.closeCardModal = function() { document.getElementById('cardEditModal').classList.add('hidden'); }

window.saveCardData = async function() {
  const id = document.getElementById('editCardId').value;
  const payload = {
    church_id: state.activeChurch,
    category: document.getElementById('editCardCat').value,
    scripture_ref: document.getElementById('editCardRef').value.trim(),
    scripture: document.getElementById('editCardScripture').value.trim(),
    prayer_text: document.getElementById('editCardPrayer').value.trim()
  };
  if (id) await db.from('spiritual_cards').update(payload).eq('id', id);
  else await db.from('spiritual_cards').insert([payload]);
  closeCardModal();
  await loadPastoralBotSettings();
}

window.deleteCard = async function(id) {
  if (!confirm('確定刪除此金句卡？')) return;
  await db.from('spiritual_cards').delete().eq('id', id);
  await loadPastoralBotSettings();
}

window.openNewJourneyModal = function() {
  document.getElementById('editJourneyId').value = '';
  document.getElementById('journeyChurchDisplay').value = (state.activeChurch === 'SHiNE') ? '火樂教會 (SHiNE)' : 'Ｍ＋大雅教會';
  document.getElementById('editJourneyDay').value = '1';
  document.getElementById('editJourneyTitle').value = '';
  document.getElementById('editJourneyMessage').value = '';
  document.getElementById('journeyModalTitle').innerText = `新增【${state.activeChurch}】專屬新朋友旅程階段`;
  document.getElementById('journeyEditModal').classList.remove('hidden');
}

window.editJourneyStep = function(id) {
  const j = state.cachedJourney.find(x => x.id === id);
  if (!j) return;
  document.getElementById('editJourneyId').value = j.id;
  document.getElementById('journeyChurchDisplay').value = (state.activeChurch === 'SHiNE') ? '火樂教會 (SHiNE)' : 'Ｍ＋大雅教會';
  document.getElementById('editJourneyDay').value = j.day_offset || 1;
  document.getElementById('editJourneyTitle').value = j.title || '';
  document.getElementById('editJourneyMessage').value = j.message || '';
  document.getElementById('journeyModalTitle').innerText = `編輯【${state.activeChurch}】旅程：第 ${j.day_offset} 天`;
  document.getElementById('journeyEditModal').classList.remove('hidden');
}

window.closeJourneyModal = function() { document.getElementById('journeyEditModal').classList.add('hidden'); }

window.saveJourneyData = async function() {
  const id = document.getElementById('editJourneyId').value;
  const day = parseInt(document.getElementById('editJourneyDay').value) || 1;
  const title = document.getElementById('editJourneyTitle').value.trim();
  const message = document.getElementById('editJourneyMessage').value.trim();
  if (!title || !message) return alert('請填寫完整旅程資料！');

  const payload = { church_id: state.activeChurch, day_offset: day, title, message };
  if (id) await db.from('newcomer_journey_steps').update(payload).eq('id', id);
  else await db.from('newcomer_journey_steps').insert([payload]);

  closeJourneyModal();
  await loadPastoralBotSettings();
}

window.deleteJourneyStep = async function(id) {
  if (!confirm('確定刪除此旅程步驟？')) return;
  await db.from('newcomer_journey_steps').delete().eq('id', id);
  await loadPastoralBotSettings();
}

window.saveNewcomerNotifySettings = async function() {
  const name = document.getElementById('notifyPastorName').value.trim();
  const lineId = document.getElementById('notifyPastorLineId').value.trim();
  await db.from('churches').update({ notify_pastor_name: name, notify_pastor_line_id: lineId }).eq('id', state.activeChurch);
  alert('✨ 新朋友即時推播接收設定已成功儲存！');
}

window.filterGreetingCards = function(cat) {
  state.currentGreetingFilter = cat;
  const list = (cat === 'ALL') ? state.cachedGreetingCards : state.cachedGreetingCards.filter(c => c.category === cat);
  document.getElementById('count-gc-ALL').innerText = state.cachedGreetingCards.length;
  document.getElementById('count-gc-同事打拼').innerText = state.cachedGreetingCards.filter(c => c.category === '同事打拼').length;
  document.getElementById('count-gc-低潮陪伴').innerText = state.cachedGreetingCards.filter(c => c.category === '低潮陪伴').length;
  document.getElementById('count-gc-家人問候').innerText = state.cachedGreetingCards.filter(c => c.category === '家人問候').length;

  ['ALL', '同事打拼', '低潮陪伴', '家人問候'].forEach(k => {
    const btn = document.getElementById(`tab-gc-${k}`);
    if (btn) btn.className = (k === cat) ? 'px-3.5 py-1.5 rounded-lg text-xs font-extrabold btn-warm' : 'px-3.5 py-1.5 rounded-lg text-xs font-bold text-stone-600';
  });

  const container = document.getElementById('greetingCardsGridContainer');
  if (!container) return;
  if (!list.length) { container.innerHTML = '<div class="col-span-3 text-center text-stone-400 py-12 text-xs">目前無圖卡</div>'; return; }
  container.innerHTML = list.map(c => `
    <div class="lux-card overflow-hidden flex flex-col justify-between text-xs">
      <div class="h-44 bg-stone-100 overflow-hidden">
        <img src="${c.image_url}" class="w-full h-full object-cover">
      </div>
      <div class="p-4 space-y-2">
        <div class="flex justify-between items-center">
          <h4 class="font-black text-stone-800 text-sm">${c.title}</h4>
          <span class="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 font-bold text-stone-600">${c.category}</span>
        </div>
        <p class="text-stone-500 line-clamp-2">${c.share_caption || ''}</p>
      </div>
      <div class="p-3 border-t flex justify-end">
        <button onclick="deleteGreetingCard(${c.id})" class="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 font-bold"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

window.openNewGreetingCardModal = function() {
  document.getElementById('newGcTitle').value = '';
  document.getElementById('newGcCaption').value = '';
  document.getElementById('newGcFileInput').value = '';
  document.getElementById('newGreetingCardModal').classList.remove('hidden');
}

window.closeNewGreetingCardModal = function() { document.getElementById('newGreetingCardModal').classList.add('hidden'); }

window.submitNewGreetingCard = async function() {
  const title = document.getElementById('newGcTitle').value.trim();
  const caption = document.getElementById('newGcCaption').value.trim();
  const category = document.getElementById('newGcCat').value;
  const fileInput = document.getElementById('newGcFileInput');

  if (!title || !fileInput.files.length) return alert('請填寫標題並選擇圖片！');
  const file = fileInput.files[0];
  const btn = document.getElementById('btnSaveNewGc');
  btn.disabled = true;
  btn.innerText = '上傳中...';

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `greetings/${state.activeChurch}_${Date.now()}.${fileExt}`;
    await db.storage.from('church-media').upload(fileName, file);
    const { data: pubData } = db.storage.from('church-media').getPublicUrl(fileName);

    await db.from('share_greeting_cards').insert([{
      church_id: state.activeChurch,
      title,
      category,
      share_caption: caption,
      image_url: pubData.publicUrl
    }]);

    closeNewGreetingCardModal();
    await loadPastoralBotSettings();
  } catch(err) {
    alert('上傳失敗：' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerText = '確認上傳建立';
  }
}

window.deleteGreetingCard = async function(id) {
  if (!confirm('確定刪除此祝福圖卡？')) return;
  await db.from('share_greeting_cards').delete().eq('id', id);
  await loadPastoralBotSettings();
}
