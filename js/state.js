// js/state.js
export const SUPABASE_URL = "https://vpysepgvweabioklppda.supabase.co";
export const SUPABASE_KEY = "sb_publishable_6Uhqw7j8vLSuI9nOqsFVzA_YYRXfrjL";
export const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

export const state = {
  currentUser: null,
  activeChurch: "SHiNE",
  cachedChurches: {},
  cachedMembers: [],
  cachedGroups: [],
  cachedServices: [],
  cachedRooms: [],
  cachedAmenities: [],
  cachedBookings: [],
  cachedAdmins: [],
  cachedTemplates: [],
  cachedCards: [],
  cachedJourney: [],
  cachedGreetingCards: [],
  currentUploadCardId: null,
  activeManagingGroup: null,
  currentGreetingFilter: "ALL",
  memberViewMode: "cards"
};

export const MINISTRY_OPTIONS = [
  "敬拜主領", "敬拜歌者", "司琴鍵盤", "木吉他", "電吉他", "Bass手", 
  "爵士鼓手", "音控PA", "直播導播", "投影簡報", "主日招待", 
  "兒童主日學老師", "學青輔導", "總務愛筵", "關懷代禱",
  "網站管理", "社群媒體小編", "小組長", "美編設計",
  "司會報告", "主日禱告", "接送同工", "聖餐事奉"
];
export let selectedMinistries = new Set();

export function getChurchTerms(churchId) {
  return churchId === 'SHiNE' 
    ? { group: '小家', leader: '小家長', member: '小家成員' }
    : { group: '小組', leader: '小組長', member: '小組組員' };
}
