// js/superadmin.js
import { db, state } from './state.js';

export async function loadAdminUsersList() {
  const { data } = await db.from('admin_users').select('*').order('id');
  state.cachedAdmins = data || [];
  const container = document.getElementById('adminUsersCardsList');
  if (!container) return;
  container.innerHTML = state.cachedAdmins.map(u => `
    <div class="lux-card p-4 flex justify-between items-center text-xs">
      <div>
        <span class="font-black text-stone-800">${u.name}</span>
        <span class="text-[10px] text-stone-400 ml-1.5">(${u.assigned_church || '全堂會'})</span>
      </div>
      <span class="px-2.5 py-0.5 rounded-lg bg-orange-50 text-orange-800 font-bold">${u.role}</span>
    </div>
  `).join('');
}

window.loadChurchConfigInputs = function() {
  const target = document.getElementById('configChurchTarget').value;
  const c = state.cachedChurches[target] || {};
  document.getElementById('configColorText').value = c.brand_color || '#F97316';
  document.getElementById('configColorPicker').value = c.brand_color || '#f97316';
  document.getElementById('configLogoUrl').value = c.logo_url || '';
}

window.saveChurchBranding = async function() {
  const target = document.getElementById('configChurchTarget').value;
  const color = document.getElementById('configColorText').value.trim();
  const logo = document.getElementById('configLogoUrl').value.trim();
  await db.from('churches').update({ brand_color: color, logo_url: logo }).eq('id', target);
  alert('✨ 堂會視覺風格已成功更新！');
}

window.openAdminModal = function() {
  document.getElementById('adminEditId').value = '';
  document.getElementById('admName').value = '';
  document.getElementById('admPwd').value = '';
  document.getElementById('adminUserModal').classList.remove('hidden');
}

window.closeAdminModal = function() { document.getElementById('adminUserModal').classList.add('hidden'); }

window.saveAdminUser = async function() {
  const name = document.getElementById('admName').value.trim();
  const pwd = document.getElementById('admPwd').value.trim();
  if (!name || !pwd) return alert('姓名與授權碼必填！');
  await db.from('admin_users').insert([{
    name,
    password: pwd,
    assigned_church: document.getElementById('admChurch').value,
    role: 'CHURCH_ADMIN',
    can_manage_members: document.getElementById('permMembers').checked,
    can_manage_schedules: document.getElementById('permSchedules').checked,
    can_manage_attendance: document.getElementById('permAttendance').checked,
    can_manage_spaces: document.getElementById('permSpaces').checked,
    can_manage_prayers: document.getElementById('permPrayers').checked,
    is_active: true
  }]);
  closeAdminModal();
  await loadAdminUsersList();
}
