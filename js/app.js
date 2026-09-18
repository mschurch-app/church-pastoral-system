// js/app.js
export const SUPABASE_URL = "https://vpysepgvweabioklppda.supabase.co";
export const SUPABASE_KEY = "sb_publishable_6Uhqw7j8vLSuI9nOqsFVzA_YYRXfrjL";
export const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

export let currentUser = null;
export let activeChurch = "SHiNE";
export let cachedChurches = {};
export let cachedMembers = [];
export let cachedGroups = [];
export let cachedServices = [];
export let cachedRooms = [];
export let cachedAmenities = [];
export let cachedBookings = [];
export let cachedAdmins = [];
export let cachedTemplates = [];
export let cachedCards = [];
export let cachedJourney = [];
export let cachedGreetingCards = [];
export let currentUploadCardId = null;
export let activeManagingGroup = null;
export let currentGreetingFilter = "ALL";
export let memberViewMode = "cards";

export const MINISTRY_OPTIONS = [
  "敬拜主領", "敬拜歌者", "司琴鍵盤", "木吉他", "電吉他", "Bass手", 
  "爵士鼓手", "音控PA", "直播導播", "投影簡報", "主日招待", 
  "兒童主日學老師", "學青輔導", "總務愛筵", "關懷代禱",
  "網站管理", "社群媒體小編", "小組長", "美編設計",
  "司會報告", "主日禱告", "接送同工", "聖餐事奉"
];
export let selectedMinistries = new Set();

// 設定全域 Setter 讓各模組可以安全修改狀態
appStore.currentUser = currentUser; // 或者是透過函式封裝
