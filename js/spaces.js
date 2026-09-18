// js/spaces.js
import { db, state } from './state.js';
import { loadGroups } from './groups.js';

export async function loadRoomsAndSpaces() {
  const { data: rms } = await db.from('rooms').select('*').eq('church_id', state.activeChurch).eq('is_active', true).order('id');
  state.cachedRooms = rms || [];

  const { data: ams } = await db.from('room_amenities').select('*').eq('church_id', state.activeChurch).eq('is_active', true).order('id');
  state.cachedAmenities = ams || [];

  const { data: bks } = await db.from('room_bookings').select('*').eq('church_id', state.activeChurch).order('booking_date', { ascending: false });
  state.cachedBookings = bks || [];

  renderRoomsCards();
  renderBookingsCards();
}

window.switchSpaceSubTab = function(tab) {
  document.getElementById('sub-sp-rooms').classList.toggle('hidden', tab !== 'rooms');
  document.getElementById('sub-sp-bookings').classList.toggle('hidden', tab !== 'bookings');
  document.getElementById('btn-sp-rooms').className = (tab === 'rooms') ? 'px-3.5 py-1.5 rounded-xl font-extrabold btn-warm' : 'px-3.5 py-1.5 rounded-xl font-extrabold text-stone-600';
  document.getElementById('btn-sp-bookings').className = (tab === 'bookings') ? 'px-3.5 py-1.5 rounded-xl font-extrabold btn-warm' : 'px-3.5 py-1.5 rounded-xl font-extrabold text-stone-600';
}

function renderRoomsCards() {
  const c = document.getElementById('sub-sp-rooms');
  if (!c) return;
  if (!state.cachedRooms.length) {
    c.innerHTML = `<div class="col-span-full py-16 text-center text-stone-400 text-xs">目前無空間資料</div>`;
    return;
  }
  c.innerHTML = state.cachedRooms.map(rm => `
    <div class="lux-card p-6 space-y-4 flex flex-col justify-between">
      <div class="space-y-3">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-black text-stone-800 text-lg tracking-tight"><i class="fa-solid fa-door-open text-orange-600 mr-1.5"></i>${rm.name}</h3>
            <span class="text-xs text-stone-400 font-bold mt-0.5 block">${rm.floor || '1F'} · 容納約 ${rm.capacity || 100} 人</span>
          </div>
          <span class="text-[11px] px-2.5 py-1 rounded-xl bg-orange-100 text-orange-900 font-extrabold">${rm.is_available_for_rent ? '可對外租借' : '僅內部使用'}</span>
        </div>
        ${rm.equipment ? `<p class="text-xs text-stone-500 line-clamp-2">設備：${rm.equipment}</p>` : ''}
      </div>
      <div class="pt-3.5 border-t border-stone-200/80 flex justify-end gap-2">
        <button onclick="editRoom(${rm.id})" class="px-3.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 text-xs font-bold"><i class="fa-solid fa-pen text-[10px] mr-1"></i>編輯</button>
        <button onclick="deleteRoom(${rm.id}, '${rm.name}')" class="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

function renderBookingsCards() {
  const c = document.getElementById('bookingsListContainer');
  if (!c) return;
  const pendingCount = state.cachedBookings.filter(b => b.status === '待審核').length;
  document.getElementById('countPendingBookings').innerText = pendingCount;
  if (!state.cachedBookings.length) {
    c.innerHTML = `<div class="col-span-full py-16 text-center text-stone-400 text-xs">目前無預約紀錄</div>`;
    return;
  }
  c.innerHTML = state.cachedBookings.map(b => {
    const rm = state.cachedRooms.find(r => r.id === b.room_id);
    const isPending = b.status === '待審核';
    return `
      <div class="lux-card p-5 space-y-3.5 text-xs flex flex-col justify-between">
        <div class="space-y-2">
          <div class="flex justify-between items-start">
            <div>
              <span class="font-black text-base text-stone-800">${rm ? rm.name : '空間'}</span>
              <p class="text-xs text-orange-800 font-extrabold mt-1">🗓️ ${b.booking_date} (${b.start_time?.slice(0,5)} ~ ${b.end_time?.slice(0,5)})</p>
            </div>
            <span class="text-xs px-3 py-1 rounded-xl font-black ${b.status === '已核准' ? 'bg-emerald-100 text-emerald-800' : isPending ? 'bg-amber-100 text-amber-900' : 'bg-rose-100 text-rose-800'}">${b.status}</span>
          </div>
          <p class="text-stone-600">用途：${b.purpose || '聚會活動'}</p>
        </div>
        <div class="pt-3 border-t border-stone-200/80 flex items-center justify-between">
          <span class="text-[11px] text-stone-400">${b.applicant_name} (${b.applicant_phone || '無電話'})</span>
          <div class="flex gap-1.5">
            ${isPending ? `<button onclick="approveBooking(${b.id})" class="px-3 py-1.5 rounded-xl btn-warm text-xs font-bold">核准</button><button onclick="rejectBooking(${b.id})" class="px-2.5 py-1.5 rounded-xl bg-stone-100 text-stone-600 text-xs font-bold">駁回</button>` : `<button onclick="deleteBooking(${b.id})" class="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-600"><i class="fa-solid fa-trash"></i></button>`}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.openRoomEditModal = function() {
  document.getElementById('editRoomId').value = '';
  document.getElementById('rmName').value = '';
  document.getElementById('rmFloor').value = '1F';
  document.getElementById('rmCapacity').value = '50';
  document.getElementById('rmEquipment').value = '';
  document.getElementById('rmHourlyRate').value = '1000';
  document.getElementById('rmCleaningFee').value = '500';
  document.getElementById('roomModalTitle').innerText = '新增教會空間';
  document.getElementById('roomEditModal').classList.remove('hidden');
}

window.closeRoomEditModal = function() { document.getElementById('roomEditModal').classList.add('hidden'); }

window.editRoom = function(id) {
  const rm = state.cachedRooms.find(r => r.id === id);
  if (!rm) return;
  document.getElementById('editRoomId').value = rm.id;
  document.getElementById('rmName').value = rm.name;
  document.getElementById('rmFloor').value = rm.floor || '';
  document.getElementById('rmCapacity').value = rm.capacity || '';
  document.getElementById('rmEquipment').value = rm.equipment || '';
  document.getElementById('rmHourlyRate').value = rm.hourly_rate || '';
  document.getElementById('rmCleaningFee').value = rm.cleaning_fee || '';
  document.getElementById('rmAvailableRent').value = rm.is_available_for_rent ? 'true' : 'false';
  document.getElementById('roomModalTitle').innerText = `編輯空間：${rm.name}`;
  document.getElementById('roomEditModal').classList.remove('hidden');
}

window.saveRoomData = async function() {
  const id = document.getElementById('editRoomId').value;
  const name = document.getElementById('rmName').value.trim();
  if (!name) return alert('空間名稱不得為空！');
  const payload = {
    church_id: state.activeChurch,
    name,
    floor: document.getElementById('rmFloor').value.trim(),
    capacity: parseInt(document.getElementById('rmCapacity').value) || 50,
    equipment: document.getElementById('rmEquipment').value.trim(),
    hourly_rate: parseInt(document.getElementById('rmHourlyRate').value) || 0,
    cleaning_fee: parseInt(document.getElementById('rmCleaningFee').value) || 0,
    is_available_for_rent: document.getElementById('rmAvailableRent').value === 'true',
    is_active: true
  };
  if (id) await db.from('rooms').update(payload).eq('id', id);
  else await db.from('rooms').insert([payload]);
  closeRoomEditModal();
  await loadRoomsAndSpaces();
}

window.deleteRoom = async function(id, name) {
  if (!confirm(`確定刪除【${name}】？`)) return;
  await db.from('rooms').delete().eq('id', id);
  await loadRoomsAndSpaces();
}

window.openNewBookingModal = function() {
  document.getElementById('bkRoomSelect').innerHTML = state.cachedRooms.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
  document.getElementById('bkDate').value = new Date().toISOString().split('T')[0];
  calculateBookingFee();
  document.getElementById('bookingModal').classList.remove('hidden');
}

window.closeBookingModal = function() { document.getElementById('bookingModal').classList.add('hidden'); }

window.calculateBookingFee = function() {
  const type = document.getElementById('bkTypeSelect').value;
  const start = document.getElementById('bkStartTime').value;
  const end = document.getElementById('bkEndTime').value;
  if (!start || !end) return;
  const hours = Math.max(1, parseInt(end.split(':')[0]) - parseInt(start.split(':')[0]));
  document.getElementById('displayHours').innerText = hours;
  if (type !== '對外租借') {
    document.getElementById('displayTotalFee').innerText = '0';
    return;
  }
  const roomId = parseInt(document.getElementById('bkRoomSelect').value);
  const rm = state.cachedRooms.find(r => r.id === roomId);
  const rate = rm ? (rm.hourly_rate || 1000) : 1000;
  const clean = rm ? (rm.cleaning_fee || 500) : 500;
  document.getElementById('displayTotalFee').innerText = (hours * rate + clean).toLocaleString();
}

window.submitBookingData = async function() {
  const roomId = parseInt(document.getElementById('bkRoomSelect').value);
  const name = document.getElementById('bkApplicantName').value.trim();
  const phone = document.getElementById('bkApplicantPhone').value.trim();
  const purpose = document.getElementById('bkPurpose').value.trim();
  if (!name) return alert('請填寫申請人！');
  await db.from('room_bookings').insert([{
    church_id: state.activeChurch,
    room_id: roomId,
    applicant_name: name,
    contact_phone: phone,
    booking_date: document.getElementById('bkDate').value,
    start_time: document.getElementById('bkStartTime').value,
    end_time: document.getElementById('bkEndTime').value,
    purpose: purpose || '聚會活動',
    status: '待審核'
  }]);
  closeBookingModal();
  await loadRoomsAndSpaces();
}

window.approveBooking = async function(id) {
  await db.from('room_bookings').update({ status: '已核准' }).eq('id', id);
  await loadRoomsAndSpaces();
}

window.rejectBooking = async function(id) {
  await db.from('room_bookings').update({ status: '已駁回' }).eq('id', id);
  await loadRoomsAndSpaces();
}

window.deleteBooking = async function(id) {
  await db.from('room_bookings').delete().eq('id', id);
  await loadRoomsAndSpaces();
}
