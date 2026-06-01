import {
  getFirebaseStatus,
  getFirebaseUserEmail,
  getFirebaseUserId,
  initCoachFirebase,
  loadCoachState,
  loadPaymentState,
  onFirebaseStatusChange,
  saveCoachState,
  savePaymentState,
  signInCoachWithGoogle,
  signOutCoach,
} from "./firebase.js";

const STORAGE_KEY = "neon-forge-state-v1";

const GOAL_LABELS = {
  emagrecimento: "Emagrecimento",
  hipertrofia: "Hipertrofia",
  forca: "Força",
  resistencia: "Resistência",
  recomposicao: "Recomposição",
  corrida: "Corrida",
  caminhada: "Caminhada",
  mobilidade: "Mobilidade",
  misto: "Misto",
};

const GOAL_TONES = {
  emagrecimento: "Volume inteligente, gasto calórico e cardio bem distribuído.",
  hipertrofia: "Volume progressivo, controle de execução e recuperação planejada.",
  forca: "Séries pesadas, maior descanso e padrões compostos prioritários.",
  resistencia: "Capacidade aeróbica, densidade de esforço e controle de ritmo.",
  recomposicao: "Mistura equilibrada de força, cardio e recuperação.",
  corrida: "Progressão aeróbica, técnica e consistência semanal.",
  caminhada: "Zona 2, constância e recuperação ativa.",
  mobilidade: "Controle articular, estabilidade e mobilidade consciente.",
  misto: "Plano híbrido com força, cardio e mobilidade.",
};

const SESSION_TAGS = {
  push: ["push"],
  pull: ["pull"],
  legs: ["legs"],
  lower: ["legs", "posterior", "glutes"],
  upper: ["push", "pull"],
  full: ["full", "push", "pull", "legs", "core", "cardio"],
  conditioning: ["conditioning", "hiit", "cardio"],
  intervals: ["conditioning", "hiit", "cardio"],
  mobility: ["mobility", "core"],
  core: ["core", "mobility"],
  run: ["running", "cardio", "endurance"],
  walk: ["walking", "cardio", "recovery"],
};

const GOAL_SEQUENCES = {
  emagrecimento: ["full", "conditioning", "lower", "upper", "intervals", "mobility", "walk"],
  hipertrofia: ["push", "pull", "legs", "upper", "lower", "conditioning", "mobility"],
  forca: ["lower", "push", "pull", "lower", "upper", "full", "mobility"],
  resistencia: ["conditioning", "run", "strength", "conditioning", "walk", "mobility", "core"],
  recomposicao: ["push", "pull", "legs", "conditioning", "upper", "lower", "mobility"],
  corrida: ["run", "strength", "intervals", "run", "mobility", "walk", "core"],
  caminhada: ["walk", "strength", "walk", "mobility", "walk", "core", "conditioning"],
  mobilidade: ["mobility", "core", "mobility", "walk", "mobility", "strength", "mobility"],
  misto: ["full", "push", "pull", "legs", "conditioning", "upper", "mobility"],
};

const ACTIVE_WEEKDAYS = {
  3: [1, 3, 5],
  4: [1, 2, 4, 6],
  5: [1, 2, 3, 5, 6],
  6: [1, 2, 3, 4, 5, 6],
  7: [0, 1, 2, 3, 4, 5, 6],
};

const WEEK_PHASES = ["Base", "Progressão", "Pico", "Deload"];

const DEFAULT_PROFILE = {
  name: "",
  age: 30,
  goal: "misto",
  horizon: "weekly",
  location: "home",
  level: "beginner",
  daysPerWeek: 5,
  sessionTime: 45,
  cardioStyle: "mixed",
  intensity: "high",
  equipment: ["none"],
  focus: ["strength", "hypertrophy", "cardio"],
  restrictions: "",
  preferences: "",
};

const exerciseLibrary = [
  {
    id: "push_up",
    name: "Flexão de braço",
    tags: ["push", "strength", "hypertrophy", "full"],
    modes: ["home", "hybrid"],
    equipment: ["none"],
    muscles: ["peito", "tríceps", "core"],
    detail: "Corpo alinhado, abdome travado e cotovelos controlados.",
    cue: "Desça com o peito apontando entre as mãos.",
    linkQuery: "flexão de braço execução correta",
    riskTags: ["shoulder", "wrist"],
  },
  {
    id: "incline_push_up",
    name: "Flexão inclinada",
    tags: ["push", "beginner", "full"],
    modes: ["home", "hybrid"],
    equipment: ["bench", "none"],
    muscles: ["peito", "tríceps", "core"],
    detail: "Use uma bancada ou parede para reduzir a carga.",
    cue: "Excelente para adaptação inicial.",
    linkQuery: "flexão inclinada execução correta",
    riskTags: ["shoulder", "wrist"],
  },
  {
    id: "pike_push_up",
    name: "Pike push-up",
    tags: ["push", "shoulders", "hypertrophy", "full"],
    modes: ["home", "hybrid"],
    equipment: ["none"],
    muscles: ["ombros", "tríceps"],
    detail: "Quadril alto, tronco inclinado e foco no ombro.",
    cue: "Pense em empurrar o chão para longe.",
    linkQuery: "pike push up execução correta",
    riskTags: ["shoulder", "wrist"],
  },
  {
    id: "squat",
    name: "Agachamento livre",
    tags: ["legs", "strength", "hypertrophy", "full"],
    modes: ["home", "gym", "hybrid"],
    equipment: ["none", "dumbbells", "barbell", "machines"],
    muscles: ["quadríceps", "glúteos", "core"],
    detail: "Pés firmes, tronco estável e amplitude controlada.",
    cue: "Desça com controle e suba acelerando.",
    linkQuery: "agachamento livre execução correta",
    riskTags: ["knee", "lower_back"],
  },
  {
    id: "split_squat",
    name: "Split squat",
    tags: ["legs", "balance", "hypertrophy", "full"],
    modes: ["home", "gym", "hybrid"],
    equipment: ["none", "dumbbells"],
    muscles: ["glúteos", "quadríceps", "estabilidade"],
    detail: "Base unilateral para pernas e estabilidade de quadril.",
    cue: "Mantenha o tronco alto e o joelho da frente firme.",
    linkQuery: "split squat execução correta",
    riskTags: ["knee"],
  },
  {
    id: "lunge",
    name: "Afundo alternado",
    tags: ["legs", "hypertrophy", "full"],
    modes: ["home", "gym", "hybrid"],
    equipment: ["none", "dumbbells"],
    muscles: ["glúteos", "quadríceps"],
    detail: "Passo amplo e descida vertical com controle.",
    cue: "O joelho da frente acompanha a ponta do pé.",
    linkQuery: "afundo alternado execução correta",
    riskTags: ["knee"],
  },
  {
    id: "glute_bridge",
    name: "Ponte de glúteo",
    tags: ["legs", "glutes", "mobility", "full"],
    modes: ["home", "gym", "hybrid"],
    equipment: ["none", "band", "dumbbells", "barbell"],
    muscles: ["glúteos", "posterior de coxa"],
    detail: "Eleve o quadril sem hiperestender a lombar.",
    cue: "Segure um segundo no topo.",
    linkQuery: "ponte de glúteo execução correta",
    riskTags: ["lower_back"],
  },
  {
    id: "wall_sit",
    name: "Wall sit",
    tags: ["legs", "conditioning", "full"],
    modes: ["home", "gym", "hybrid"],
    equipment: ["none"],
    muscles: ["quadríceps", "resistência"],
    detail: "Isometria simples e brutal para perna e tolerância ao esforço.",
    cue: "Costas na parede e respiração controlada.",
    linkQuery: "wall sit exercício execução correta",
    riskTags: ["knee"],
  },
  {
    id: "plank",
    name: "Prancha frontal",
    tags: ["core", "mobility", "full"],
    modes: ["home", "gym", "hybrid"],
    equipment: ["none"],
    muscles: ["core", "estabilidade"],
    detail: "Corpo inteiro em bloco, costelas fechadas e glúteos ativos.",
    cue: "Não deixe a lombar cair.",
    linkQuery: "prancha frontal execução correta",
    riskTags: ["wrist", "lower_back"],
  },
  {
    id: "dead_bug",
    name: "Dead bug",
    tags: ["core", "mobility", "full"],
    modes: ["home", "gym", "hybrid"],
    equipment: ["none"],
    muscles: ["core", "coordenação"],
    detail: "Controle lombar e coordenação contralateral.",
    cue: "Cole a lombar no chão o tempo todo.",
    linkQuery: "dead bug exercício execução correta",
    riskTags: ["lower_back"],
  },
  {
    id: "bird_dog",
    name: "Bird dog",
    tags: ["core", "mobility", "full"],
    modes: ["home", "gym", "hybrid"],
    equipment: ["none"],
    muscles: ["core", "estabilidade"],
    detail: "Ótimo para tronco e estabilidade lombar.",
    cue: "Estenda braço e perna sem girar o quadril.",
    linkQuery: "bird dog exercício execução correta",
    riskTags: ["lower_back"],
  },
  {
    id: "superman_pull",
    name: "Superman pull",
    tags: ["pull", "core", "mobility", "full"],
    modes: ["home", "hybrid"],
    equipment: ["none"],
    muscles: ["costas", "lombar", "glúteos"],
    detail: "Elevação leve com puxada curta para ativar costas.",
    cue: "Perfeito para casa sem equipamento.",
    linkQuery: "superman pull exercício execução correta",
    riskTags: ["lower_back"],
  },
  {
    id: "y_t_w",
    name: "Y-T-W no solo",
    tags: ["pull", "mobility", "full"],
    modes: ["home", "hybrid"],
    equipment: ["none"],
    muscles: ["costas", "ombros", "escápulas"],
    detail: "Postura, escápulas e mobilidade torácica.",
    cue: "Desenhe as letras com controle e sem pressa.",
    linkQuery: "Y T W exercício costas execução correta",
    riskTags: ["shoulder"],
  },
  {
    id: "reverse_snow_angel",
    name: "Reverse snow angel",
    tags: ["pull", "mobility", "full"],
    modes: ["home", "hybrid"],
    equipment: ["none"],
    muscles: ["costas", "ombros", "core"],
    detail: "Abertura de ombros com controle e amplitude.",
    cue: "Ideal para aquecimento e postura.",
    linkQuery: "reverse snow angel exercício execução correta",
    riskTags: ["shoulder"],
  },
  {
    id: "row",
    name: "Remada curvada",
    tags: ["pull", "strength", "hypertrophy", "full"],
    modes: ["gym", "hybrid"],
    equipment: ["barbell", "dumbbells", "band"],
    muscles: ["costas", "bíceps", "postura"],
    detail: "Tronco firme, cotovelo puxando para trás.",
    cue: "Pense em levar o cotovelo ao bolso.",
    linkQuery: "remada curvada execução correta",
    riskTags: ["lower_back"],
  },
  {
    id: "lat_pulldown",
    name: "Puxada alta",
    tags: ["pull", "strength", "hypertrophy", "full"],
    modes: ["gym"],
    equipment: ["machines"],
    muscles: ["costas", "bíceps"],
    detail: "Puxe a barra até a parte superior do peito sem roubar.",
    cue: "Escápulas encaixadas e tronco estável.",
    linkQuery: "puxada alta execução correta",
    riskTags: ["shoulder"],
  },
  {
    id: "romanian_deadlift",
    name: "Terra romeno",
    tags: ["lower", "strength", "hypertrophy", "full"],
    modes: ["gym", "hybrid"],
    equipment: ["barbell", "dumbbells"],
    muscles: ["posterior de coxa", "glúteos", "lombar"],
    detail: "Hinge de quadril com barra perto do corpo.",
    cue: "Sinta alongar a cadeia posterior.",
    linkQuery: "terra romeno execução correta",
    riskTags: ["lower_back"],
  },
  {
    id: "leg_press",
    name: "Leg press",
    tags: ["legs", "strength", "hypertrophy", "full"],
    modes: ["gym"],
    equipment: ["machines"],
    muscles: ["quadríceps", "glúteos"],
    detail: "Controle a amplitude sem perder a lombar no encosto.",
    cue: "Desça devagar e suba forte.",
    linkQuery: "leg press execução correta",
    riskTags: ["knee", "lower_back"],
  },
  {
    id: "military_press",
    name: "Desenvolvimento militar",
    tags: ["push", "strength", "hypertrophy", "full"],
    modes: ["gym", "hybrid"],
    equipment: ["dumbbells", "barbell"],
    muscles: ["ombros", "tríceps", "core"],
    detail: "Empurre acima da cabeça com o core travado.",
    cue: "Evite compensar com a lombar.",
    linkQuery: "desenvolvimento militar execução correta",
    riskTags: ["shoulder", "lower_back"],
  },
  {
    id: "calf_raise",
    name: "Elevação de panturrilha",
    tags: ["legs", "hypertrophy", "full"],
    modes: ["home", "gym", "hybrid"],
    equipment: ["none", "dumbbells", "machines"],
    muscles: ["panturrilhas"],
    detail: "Amplitude máxima com pausa no topo.",
    cue: "Desça devagar, suba completo.",
    linkQuery: "elevação de panturrilha execução correta",
    riskTags: ["ankle"],
  },
  {
    id: "burpee",
    name: "Burpee",
    tags: ["conditioning", "hiit", "full"],
    modes: ["home", "gym", "hybrid"],
    equipment: ["none"],
    muscles: ["corpo inteiro"],
    detail: "Explosivo e metabólico para queima e potência.",
    cue: "Ajuste o impacto se o corpo pedir.",
    linkQuery: "burpee execução correta",
    riskTags: ["knee", "ankle", "shoulder"],
  },
  {
    id: "mountain_climber",
    name: "Mountain climber",
    tags: ["conditioning", "hiit", "core", "full"],
    modes: ["home", "gym", "hybrid"],
    equipment: ["none"],
    muscles: ["core", "cardio"],
    detail: "Ritmo alto com tronco firme e ombros estáveis.",
    cue: "Mantenha a prancha sem balançar.",
    linkQuery: "mountain climber execução correta",
    riskTags: ["wrist"],
  },
  {
    id: "jumping_jack",
    name: "Jumping jack",
    tags: ["conditioning", "hiit", "cardio"],
    modes: ["home", "gym", "hybrid"],
    equipment: ["none"],
    muscles: ["condicionamento"],
    detail: "Clássico para aquecer e subir a frequência cardíaca.",
    cue: "Troque por versão sem salto se precisar.",
    linkQuery: "jumping jack execução correta",
    riskTags: ["knee", "ankle"],
  },
  {
    id: "high_knees",
    name: "Joelhos altos",
    tags: ["conditioning", "running", "cardio", "hiit"],
    modes: ["home", "gym", "hybrid"],
    equipment: ["none"],
    muscles: ["cardio", "coordenação"],
    detail: "Suba os joelhos com cadência e tronco firme.",
    cue: "Ótimo para HIIT ou aquecimento.",
    linkQuery: "joelhos altos execução correta",
    riskTags: ["knee", "ankle"],
  },
  {
    id: "shadow_boxing",
    name: "Boxe sombra",
    tags: ["conditioning", "cardio", "full"],
    modes: ["home", "gym", "hybrid"],
    equipment: ["none"],
    muscles: ["cardio", "coordenação", "ombros"],
    detail: "Movimento fluido para condicionamento sem impacto.",
    cue: "Excelente para intervalo e foco mental.",
    linkQuery: "shadow boxing treino execução",
    riskTags: ["shoulder", "wrist"],
  },
  {
    id: "run_easy",
    name: "Corrida leve",
    tags: ["running", "cardio", "endurance"],
    modes: ["home", "gym", "hybrid"],
    equipment: ["none", "bike"],
    muscles: ["cardio", "pernas"],
    detail: "Ritmo conversável para construir base aeróbica.",
    cue: "Respiração controlada e cadência estável.",
    linkQuery: "corrida leve técnica",
    riskTags: ["knee", "ankle"],
  },
  {
    id: "run_intervals",
    name: "Intervalos de corrida",
    tags: ["running", "conditioning", "hiit", "cardio"],
    modes: ["home", "gym", "hybrid"],
    equipment: ["none", "bike"],
    muscles: ["cardio", "potência"],
    detail: "Blocos intensos com recuperação curta.",
    cue: "Perfeito para perda de gordura e performance.",
    linkQuery: "treino intervalado corrida",
    riskTags: ["knee", "ankle"],
  },
  {
    id: "brisk_walk",
    name: "Caminhada acelerada",
    tags: ["walking", "cardio", "recovery", "endurance"],
    modes: ["home", "gym", "hybrid"],
    equipment: ["none"],
    muscles: ["cardio", "recuperação"],
    detail: "Zona 2 simples, eficiente e sustentável.",
    cue: "Base perfeita para consistência semanal.",
    linkQuery: "caminhada acelerada benefícios",
    riskTags: ["knee", "ankle"],
  },
  {
    id: "bike",
    name: "Bike ergométrica",
    tags: ["cardio", "endurance", "recovery", "conditioning"],
    modes: ["gym", "hybrid"],
    equipment: ["bike"],
    muscles: ["cardio", "pernas"],
    detail: "Baixo impacto com controle de intensidade.",
    cue: "Use para zona 2 ou HIIT.",
    linkQuery: "bike ergométrica treino",
    riskTags: ["knee"],
  },
  {
    id: "cat_cow",
    name: "Cat-cow",
    tags: ["mobility", "core", "full"],
    modes: ["home", "gym", "hybrid"],
    equipment: ["none"],
    muscles: ["coluna"],
    detail: "Flexão e extensão de coluna com respiração.",
    cue: "Excelente para iniciar ou finalizar o treino.",
    linkQuery: "cat cow execução correta",
    riskTags: ["lower_back"],
  },
  {
    id: "thoracic_rotation",
    name: "Rotação torácica",
    tags: ["mobility", "core", "full"],
    modes: ["home", "gym", "hybrid"],
    equipment: ["none"],
    muscles: ["coluna torácica"],
    detail: "Libera a região torácica e melhora postura.",
    cue: "Abra o peito sem compensar na lombar.",
    linkQuery: "rotação torácica exercício",
    riskTags: [],
  },
  {
    id: "hip_opener",
    name: "Abertura de quadril",
    tags: ["mobility", "lower", "full"],
    modes: ["home", "gym", "hybrid"],
    equipment: ["none"],
    muscles: ["quadril", "glúteos"],
    detail: "Mobilidade de quadril para agachar e correr melhor.",
    cue: "Respire fundo e não force a amplitude.",
    linkQuery: "abertura de quadril mobilidade",
    riskTags: [],
  },
];

const els = {
  appShell: document.getElementById("appShell"),
  welcomeView: document.getElementById("welcomeView"),
  formView: document.getElementById("formView"),
  dashboardView: document.getElementById("dashboardView"),
  startJourneyBtn: document.getElementById("startJourneyBtn"),
  coachForm: document.getElementById("coachForm"),
  generateBtn: document.getElementById("generateBtn"),
  demoBtn: document.getElementById("demoBtn"),
  backToWelcomeBtn: document.getElementById("backToWelcomeBtn"),
  editProfileBtn: document.getElementById("editProfileBtn"),
  resetBtn: document.getElementById("resetBtn"),
  googleAuthBtn: document.getElementById("googleAuthBtn"),
  paymentBtn: document.getElementById("paymentBtn"),
  paymentDialog: document.getElementById("paymentDialog"),
  copyPixBtn: document.getElementById("copyPixBtn"),
  paidBtn: document.getElementById("paidBtn"),
  cancelPaymentBtn: document.getElementById("cancelPaymentBtn"),
  pixKeyValue: document.getElementById("pixKeyValue"),
  firebaseStatusValue: document.getElementById("firebaseStatusValue"),
  firebaseStatusFooter: document.getElementById("firebaseStatusFooter"),
  planSummary: document.getElementById("planSummary"),
  planContainer: document.getElementById("planContainer"),
  weekSwitch: document.getElementById("weekSwitch"),
  calendarInfo: document.getElementById("calendarInfo"),
  calendarGrid: document.getElementById("calendarGrid"),
  alertsPanel: document.getElementById("alertsPanel"),
  libraryGrid: document.getElementById("libraryGrid"),
  toast: document.getElementById("toast"),
  dayDialog: document.getElementById("dayDialog"),
  dialogTag: document.getElementById("dialogTag"),
  dialogTitle: document.getElementById("dialogTitle"),
  dialogSummary: document.getElementById("dialogSummary"),
  dialogContent: document.getElementById("dialogContent"),
  streakValue: document.getElementById("streakValue"),
  completionValue: document.getElementById("completionValue"),
  planValue: document.getElementById("planValue"),
  lastWorkoutValue: document.getElementById("lastWorkoutValue"),
  heroSignal: document.getElementById("heroSignal"),
  nextWorkoutValue: document.getElementById("nextWorkoutValue"),
  modeValue: document.getElementById("modeValue"),
  planMetaValue: document.getElementById("planMetaValue"),
  calendarValue: document.getElementById("calendarValue"),
  libraryCountValue: document.getElementById("libraryCountValue"),
};

const storedState = storageRead(STORAGE_KEY, {});

const state = {
  profile: { ...createDefaultProfile(), ...(storedState.profile || {}) },
  plan: storedState.plan || null,
  checkins: storedState.checkins || {},
  payment: storedState.payment || {
    status: "none",
    updatedAt: null,
    note: "",
  },
  selectedWeek: 0,
  view: storedState.view || (storedState.plan ? "dashboard" : "welcome"),
  firebase: getFirebaseStatus(),
};

let cloudSyncTimer = null;
let firebaseBootstrapped = false;

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function storageRead(key, fallback) {
  try {
    return safeParse(localStorage.getItem(key), fallback);
  } catch {
    return fallback;
  }
}

function storageWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable
  }
}

function storageRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function createDefaultProfile() {
  return {
    ...DEFAULT_PROFILE,
    equipment: [...DEFAULT_PROFILE.equipment],
    focus: [...DEFAULT_PROFILE.focus],
  };
}

function loadStoredProfile() {
  return { ...createDefaultProfile(), ...storageRead(STORAGE_KEY, {}).profile };
}

function loadStoredPlan() {
  return storageRead(STORAGE_KEY, {}).plan || null;
}

function loadStoredCheckins() {
  return storageRead(STORAGE_KEY, {}).checkins || {};
}

function saveState() {
  storageWrite(STORAGE_KEY, {
    profile: state.profile,
    plan: state.plan,
    checkins: state.checkins,
    payment: state.payment,
    selectedWeek: state.selectedWeek,
    view: state.view,
  });
  scheduleCloudSync();
}

function scheduleCloudSync() {
  window.clearTimeout(cloudSyncTimer);
  cloudSyncTimer = window.setTimeout(() => {
    void syncCloudState();
  }, 350);
}

function applyView() {
  const target = `${state.view}View`;
  document.body.dataset.view = state.view;
  [els.welcomeView, els.formView, els.dashboardView].forEach((section) => {
    if (!section) return;
    section.classList.toggle("is-active", section.id === target);
  });
}

function setView(view, scroll = false) {
  state.view = view;
  renderAll();
  if (scroll) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function toTitleCase(value) {
  return String(value)
    .replace(/[_-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function unique(values) {
  return [...new Set(values)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dateFromKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(date) {
  const copy = new Date(date);
  const diff = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function formatDateLabel(date, options = {}) {
  const hasCustomOptions = Object.keys(options).length > 0;
  const formatOptions = hasCustomOptions ? {} : { weekday: "short", day: "2-digit", month: "short" };
  if ("weekday" in options) formatOptions.weekday = options.weekday;
  if ("day" in options) formatOptions.day = options.day;
  if ("month" in options) formatOptions.month = options.month;
  if ("year" in options) formatOptions.year = options.year;
  return date.toLocaleDateString("pt-BR", formatOptions);
}

function formatMonthLabel(date) {
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function showToast(message, tone = "success") {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.dataset.tone = tone;
  els.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    els.toast.classList.remove("is-visible");
  }, 2600);
}

function scrollToPlan() {
  els.dashboardView?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function writeProfileToForm(profile) {
  const data = { ...createDefaultProfile(), ...profile };
  for (const [key, value] of Object.entries(data)) {
    const field = els.coachForm.elements.namedItem(key);
    if (!field) continue;
    if (field instanceof RadioNodeList) continue;
    if (field.type === "checkbox") continue;
    field.value = value;
  }

  [...els.coachForm.querySelectorAll('input[name="equipment"]')].forEach((input) => {
    input.checked = data.equipment.includes(input.value);
  });

  [...els.coachForm.querySelectorAll('input[name="focus"]')].forEach((input) => {
    input.checked = data.focus.includes(input.value);
  });
}

function readProfileFromForm() {
  const form = new FormData(els.coachForm);
  const equipment = form.getAll("equipment");
  const focus = form.getAll("focus");
  const normalizedEquipment = equipment.includes("none") && equipment.length > 1 ? equipment.filter((item) => item !== "none") : equipment;
  return {
    name: String(form.get("name") || "").trim(),
    age: clamp(Number.parseInt(form.get("age"), 10) || 30, 12, 90),
    goal: String(form.get("goal") || "misto"),
    horizon: String(form.get("horizon") || "weekly"),
    location: String(form.get("location") || "home"),
    level: String(form.get("level") || "beginner"),
    daysPerWeek: clamp(Number.parseInt(form.get("daysPerWeek"), 10) || 5, 3, 7),
    sessionTime: clamp(Number.parseInt(form.get("sessionTime"), 10) || 45, 20, 90),
    cardioStyle: String(form.get("cardioStyle") || "mixed"),
    intensity: String(form.get("intensity") || "high"),
    equipment: normalizedEquipment.length ? normalizedEquipment : ["none"],
    focus: focus.length ? focus : ["strength", "hypertrophy", "cardio"],
    restrictions: String(form.get("restrictions") || "").trim(),
    preferences: String(form.get("preferences") || "").trim(),
  };
}

function bindEquipmentExclusivity() {
  els.coachForm.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.name !== "equipment") return;
    const noneInput = els.coachForm.querySelector('input[name="equipment"][value="none"]');
    const otherInputs = [...els.coachForm.querySelectorAll('input[name="equipment"]')].filter((input) => input.value !== "none");

    if (target.value === "none" && target.checked) {
      otherInputs.forEach((input) => {
        input.checked = false;
      });
    }

    if (target.value !== "none" && target.checked && noneInput) {
      noneInput.checked = false;
    }

    if (otherInputs.every((input) => !input.checked) && noneInput) {
      noneInput.checked = true;
    }
  });
}

function activeWeekdays(daysPerWeek) {
  return ACTIVE_WEEKDAYS[daysPerWeek] || ACTIVE_WEEKDAYS[5];
}

function rotatedSequence(goal, weekIndex) {
  const sequence = GOAL_SEQUENCES[goal] || GOAL_SEQUENCES.misto;
  const offset = weekIndex % sequence.length;
  return [...sequence.slice(offset), ...sequence.slice(0, offset)];
}

function matchScore(exercise, profile, sessionType) {
  const tags = SESSION_TAGS[sessionType] || SESSION_TAGS.full;
  const preferenceText = normalizeText([profile.goal, profile.preferences, profile.focus.join(" ")].join(" "));
  const restrictionText = normalizeText(profile.restrictions);
  const exerciseText = normalizeText([exercise.name, exercise.detail, exercise.cue, exercise.muscles.join(" "), exercise.tags.join(" ")].join(" "));

  let score = 0;
  const hasLocation = profile.location === "hybrid" || exercise.modes.includes(profile.location) || exercise.modes.includes("hybrid");
  if (!hasLocation) return -1000;

  if (exercise.equipment.includes("none") || exercise.equipment.some((item) => profile.equipment.includes(item))) {
    score += 5;
  } else {
    return -1000;
  }

  tags.forEach((tag) => {
    if (exercise.tags.includes(tag)) score += 6;
  });

  if (sessionType === "full" && exercise.tags.includes("full")) score += 4;
  if (sessionType === "lower" && exercise.tags.some((tag) => ["legs", "posterior", "glutes", "lower"].includes(tag))) score += 4;
  if (sessionType === "upper" && exercise.tags.some((tag) => ["push", "pull"].includes(tag))) score += 4;
  if (sessionType === "run" && exercise.tags.includes("running")) score += 6;
  if (sessionType === "walk" && exercise.tags.includes("walking")) score += 6;
  if (sessionType === "conditioning" && exercise.tags.includes("conditioning")) score += 6;
  if (sessionType === "intervals" && exercise.tags.includes("hiit")) score += 6;
  if (sessionType === "mobility" && exercise.tags.includes("mobility")) score += 6;
  if (sessionType === "core" && exercise.tags.includes("core")) score += 5;

  if (preferenceText.includes("glute") && exerciseText.includes("glut")) score += 4;
  if (preferenceText.includes("perna") && exerciseText.includes("leg")) score += 3;
  if (preferenceText.includes("peito") && exerciseText.includes("peito")) score += 3;
  if (preferenceText.includes("costas") && exerciseText.includes("costas")) score += 3;
  if (preferenceText.includes("core") && exerciseText.includes("core")) score += 3;
  if (preferenceText.includes("cardio") && exerciseText.includes("cardio")) score += 3;

  if (restrictionText.includes("joelho") && exercise.riskTags.includes("knee")) score -= 10;
  if (restrictionText.includes("ombro") && exercise.riskTags.includes("shoulder")) score -= 10;
  if (restrictionText.includes("lombar") && exercise.riskTags.includes("lower_back")) score -= 10;
  if (restrictionText.includes("tornozelo") && exercise.riskTags.includes("ankle")) score -= 10;
  if (restrictionText.includes("punho") && exercise.riskTags.includes("wrist")) score -= 10;

  if (profile.goal === "corrida" && exercise.tags.includes("running")) score += 4;
  if (profile.goal === "caminhada" && exercise.tags.includes("walking")) score += 4;
  if (profile.goal === "hipertrofia" && exercise.tags.includes("hypertrophy")) score += 4;
  if (profile.goal === "forca" && exercise.tags.includes("strength")) score += 4;
  if (profile.goal === "emagrecimento" && exercise.tags.includes("conditioning")) score += 4;
  if (profile.goal === "mobilidade" && exercise.tags.includes("mobility")) score += 4;

  return score;
}

function pickExercises(profile, sessionType, count, weekIndex, dayIndex) {
  const pool = exerciseLibrary
    .map((exercise) => ({ exercise, score: matchScore(exercise, profile, sessionType) }))
    .filter((item) => item.score > -100)
    .sort((a, b) => b.score - a.score || a.exercise.name.localeCompare(b.exercise.name));

  const offset = (weekIndex * 2 + dayIndex) % Math.max(1, pool.length);
  const ordered = [...pool.slice(offset), ...pool.slice(0, offset)];
  const chosen = [];
  const seen = new Set();

  for (const item of ordered) {
    if (seen.has(item.exercise.id)) continue;
    chosen.push(item.exercise);
    seen.add(item.exercise.id);
    if (chosen.length >= count) break;
  }

  if (!chosen.length) {
    return exerciseLibrary.slice(0, count);
  }

  if (chosen.length < count) {
    for (const item of pool) {
      if (seen.has(item.exercise.id)) continue;
      chosen.push(item.exercise);
      seen.add(item.exercise.id);
      if (chosen.length >= count) break;
    }
  }

  return chosen;
}

function levelPreset(level) {
  if (level === "advanced") return { sets: 5, reps: "6-10", rest: 75, tempo: "3-1-1", rpe: 8.6 };
  if (level === "intermediate") return { sets: 4, reps: "8-12", rest: 90, tempo: "2-1-1", rpe: 7.8 };
  return { sets: 3, reps: "10-15", rest: 105, tempo: "2-0-2", rpe: 6.8 };
}

function buildPrescription(profile, sessionType, weekIndex, totalWeeks) {
  const level = levelPreset(profile.level);
  const weekFactor = totalWeeks === 4 ? [0.95, 1, 1.08, 0.82][weekIndex] : 1;
  const intensityFactor = profile.intensity === "very_high" ? 1.1 : profile.intensity === "high" ? 1 : 0.9;
  const multiplier = weekFactor * intensityFactor;
  const base = { ...level };

  if (profile.goal === "forca") Object.assign(base, { sets: 5, reps: "4-6", rest: 120, tempo: "3-1-1", rpe: 8.8 });
  if (profile.goal === "hipertrofia") Object.assign(base, { sets: 4, reps: "8-12", rest: 75, tempo: "2-1-1", rpe: 8.2 });
  if (profile.goal === "emagrecimento") Object.assign(base, { sets: 3, reps: "12-15", rest: 45, tempo: "2-0-2", rpe: 8.1 });
  if (profile.goal === "resistencia") Object.assign(base, { sets: 3, reps: "15-20", rest: 30, tempo: "2-0-1", rpe: 7.4 });
  if (profile.goal === "corrida") Object.assign(base, { sets: 1, reps: "20-45 min", rest: 0, tempo: "ritmo controlado", rpe: 6.6 });
  if (profile.goal === "caminhada") Object.assign(base, { sets: 1, reps: "30-60 min", rest: 0, tempo: "zona 2", rpe: 4.8 });
  if (profile.goal === "mobilidade") Object.assign(base, { sets: 2, reps: "8-12 por lado", rest: 15, tempo: "controlado", rpe: 5.2 });

  if (sessionType === "conditioning" || sessionType === "intervals") {
    Object.assign(base, {
      sets: profile.sessionTime <= 30 ? 3 : 4,
      reps: sessionType === "intervals" ? "30s forte / 30s leve" : "40s forte / 20s leve",
      rest: 20,
      tempo: "explosivo",
      rpe: 8.8,
    });
  }

  if (sessionType === "mobility" || profile.goal === "mobilidade") {
    Object.assign(base, { sets: 2, reps: "8-12 por lado", rest: 15, tempo: "fluido", rpe: 5.0 });
  }

  if (sessionType === "run") {
    Object.assign(base, {
      sets: 1,
      reps: profile.cardioStyle === "hiit" ? "6-10 tiros" : profile.sessionTime >= 45 ? "30-45 min" : "20-30 min",
      rest: profile.cardioStyle === "hiit" ? 45 : 0,
      tempo: profile.cardioStyle === "hiit" ? "intervalado" : "zona 2",
      rpe: profile.cardioStyle === "hiit" ? 8.4 : 6.2,
    });
  }

  if (sessionType === "walk") {
    Object.assign(base, {
      sets: 1,
      reps: profile.sessionTime >= 45 ? "40-60 min" : "25-40 min",
      rest: 0,
      tempo: "zona 2",
      rpe: 4.6,
    });
  }

  if (sessionType === "core") {
    Object.assign(base, { sets: 3, reps: "30-45s", rest: 20, tempo: "estável", rpe: 6.2 });
  }

  const adjustedSets = sessionType === "run" || sessionType === "walk" ? 1 : Math.max(2, Math.round(base.sets * multiplier));
  const adjustedRest = sessionType === "run" || sessionType === "walk" ? base.rest : Math.max(10, Math.round(base.rest / Math.max(0.85, multiplier)));

  return {
    sets: adjustedSets,
    reps: base.reps,
    rest: adjustedRest,
    tempo: base.tempo,
    rpe: base.rpe,
  };
}

function buildWarmup(sessionType, profile) {
  if (sessionType === "run" || sessionType === "walk") {
    return [
      "3 min de mobilidade articular e marcha",
      "Ativação de tornozelo e quadril",
      "2 acelerações leves antes do bloco principal",
    ];
  }

  if (sessionType === "mobility") {
    return [
      "Respiração nasal por 1 min",
      "Cat-cow e rotação torácica",
      "Abertura dinâmica de quadril",
    ];
  }

  return [
    "Mobilidade articular de 3 min",
    "Ativação do core e escápulas",
    "Série de adaptação do primeiro exercício",
  ];
}

function buildCooldown(sessionType) {
  if (sessionType === "run" || sessionType === "walk") {
    return [
      "5 min de desaceleração",
      "Alongamento leve de panturrilha e quadril",
      "Respiração para baixar a frequência cardíaca",
    ];
  }

  if (sessionType === "mobility") {
    return [
      "Respiração profunda por 2 min",
      "Posição de descanso com coluna neutra",
      "Mobilidade leve extra se o corpo pedir",
    ];
  }

  return [
    "Respiração de recuperação por 2 min",
    "Alongamento leve do grupo mais usado",
    "Hidratação e relaxamento ativo",
  ];
}

function buildFinisher(sessionType, profile) {
  if (sessionType === "conditioning" || sessionType === "intervals") {
    return {
      title: "Finalizador metabólico",
      detail:
        profile.cardioStyle === "run"
          ? "6 tiros de 20 segundos em ritmo forte, com 40 segundos de recuperação."
          : "Circuito de 4 minutos com burpee, mountain climber e jumping jack.",
      link: `https://www.youtube.com/results?search_query=${encodeURIComponent(
        profile.cardioStyle === "run" ? "treino intervalado corrida" : "treino hiit metabólico"
      )}`,
    };
  }

  if (sessionType === "run") {
    return {
      title: "Fecho aeróbico",
      detail: "Finalize com 5 minutos de caminhada leve e respiração nasal.",
      link: `https://www.youtube.com/results?search_query=${encodeURIComponent("corrida leve técnica de corrida")}`,
    };
  }

  if (sessionType === "walk") {
    return {
      title: "Zona 2 contínua",
      detail: "Caminhada sustentada para saúde, queima calórica e recuperação.",
      link: `https://www.youtube.com/results?search_query=${encodeURIComponent("caminhada acelerada benefícios")}`,
    };
  }

  if (sessionType === "mobility") {
    return {
      title: "Reset de mobilidade",
      detail: "Sequência de respiração, rotação torácica e abertura de quadril.",
      link: `https://www.youtube.com/results?search_query=${encodeURIComponent("mobilidade quadril coluna torácica")}`,
    };
  }

  return {
    title: "Finalizador técnico",
    detail: "Core e postura por 6 minutos para consolidar a sessão.",
    link: `https://www.youtube.com/results?search_query=${encodeURIComponent("core training dead bug plank")}`,
  };
}

function buildWorkout(profile, sessionType, weekIndex, dayIndex, totalWeeks) {
  const blockCount =
    sessionType === "run" || sessionType === "walk"
      ? 1
      : sessionType === "mobility" || sessionType === "core"
      ? 3
      : sessionType === "conditioning" || sessionType === "intervals"
      ? 3
      : profile.sessionTime <= 30
      ? 3
      : profile.sessionTime <= 45
      ? 4
      : 5;

  const prescription = buildPrescription(profile, sessionType, weekIndex, totalWeeks);
  const exercises = pickExercises(profile, sessionType, blockCount, weekIndex, dayIndex).map((exercise, index) => {
    let reps = prescription.reps;
    let rest = prescription.rest;
    let tempo = prescription.tempo;
    let sets = prescription.sets;
    let detail = exercise.detail;

    if (sessionType === "run" && index === 0) {
      detail =
        profile.cardioStyle === "hiit"
          ? "Blocos curtos de corrida forte com recuperação planejada."
          : "Ritmo conversável para construir base aeróbica.";
    }

    if (sessionType === "walk" && index === 0) {
      detail = "Caminhada vigorosa com postura alta e ritmo contínuo.";
    }

    if (sessionType === "mobility") {
      reps = "8-10 por lado";
      rest = 15;
      tempo = "controlado";
      sets = 2;
    }

    return {
      id: `${exercise.id}-${weekIndex}-${dayIndex}-${index}`,
      name: exercise.name,
      detail,
      cue: exercise.cue,
      sets,
      reps,
      rest,
      tempo,
      rpe: prescription.rpe,
      link: `https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.linkQuery)}`,
      muscles: unique(exercise.muscles),
    };
  });

  return {
    type: sessionType,
    title: sessionTitle(sessionType),
    objective: sessionObjective(sessionType, profile),
    duration: profile.sessionTime,
    warmup: buildWarmup(sessionType, profile),
    blocks: exercises,
    finisher: buildFinisher(sessionType, profile),
    cooldown: buildCooldown(sessionType),
    note: noteForSession(profile, sessionType),
  };
}

function sessionTitle(type) {
  const map = {
    push: "Push",
    pull: "Pull",
    legs: "Pernas",
    lower: "Posterior e glúteos",
    upper: "Upper body",
    full: "Full body",
    conditioning: "Condicionamento",
    intervals: "Intervalos",
    mobility: "Mobilidade",
    core: "Core",
    run: "Corrida",
    walk: "Caminhada",
    recovery: "Recuperação",
    strength: "Força",
  };
  return map[type] || toTitleCase(type);
}

function sessionObjective(type, profile) {
  const objectiveMap = {
    push: "Empurrar forte com foco em peitoral, ombro e tríceps.",
    pull: "Fortalecer costas, postura e braços de tração.",
    legs: "Construir pernas, estabilidade e potência.",
    lower: "Ativar cadeia posterior, glúteos e estabilidade lombar.",
    upper: "Equilíbrio entre empurrar e puxar no tronco superior.",
    full: "Corpo inteiro com densidade e eficiência.",
    conditioning: "Gasto calórico e condicionamento metabólico.",
    intervals: "HIIT para potência, velocidade e saída de zona de conforto.",
    mobility: "Liberdade articular e recuperação ativa.",
    core: "Controle do tronco e proteção lombar.",
    run: profile.cardioStyle === "hiit" ? "Corrida intervalada e explosiva." : "Base aeróbica e ritmo constante.",
    walk: "Zona 2 e recuperação sem impacto.",
    strength: "Força total e compostos prioritários.",
    recovery: "Descanso ativo e reset do sistema.",
  };
  return objectiveMap[type] || GOAL_TONES[profile.goal] || "Sessão estratégica adaptada ao objetivo.";
}

function noteForSession(profile, sessionType) {
  if (sessionType === "run") {
    return profile.cardioStyle === "hiit"
      ? "Nesta sessão, a explosão é mais importante que a velocidade máxima."
      : "Ritmo conversável. Se faltar fôlego, reduza e sustente."
  }

  if (sessionType === "walk") {
    return "Mantenha a caminhada contínua. O foco é constância e circulação.";
  }

  if (sessionType === "mobility") {
    return "Qualidade vence amplitude. Faça tudo com respiração calma.";
  }

  return profile.preferences
    ? `Preferência do usuário aplicada: ${profile.preferences}`
    : "Sem preferência específica adicionada. O sistema escolheu a melhor combinação disponível.";
}

function buildWeeklyPattern(profile, weekIndex, totalWeeks) {
  const activeDays = activeWeekdays(profile.daysPerWeek);
  const sequence = rotatedSequence(profile.goal, weekIndex);
  const weekStart = addDays(startOfWeek(new Date()), weekIndex * 7);
  const days = [];

  activeDays.forEach((weekdayIndex, activeIndex) => {
    const date = addDays(weekStart, weekdayIndex);
    const sessionType = sequence[activeIndex % sequence.length];
    const workout = buildWorkout(profile, sessionType, weekIndex, activeIndex, totalWeeks);
    const key = dateKey(date);
    days.push({
      key,
      date,
      weekdayIndex,
      active: true,
      type: sessionType,
      label: sessionTitle(sessionType),
      badge: weekIndex === 3 && totalWeeks === 4 ? "Deload" : "Treino",
      completed: Boolean(state.checkins[key]),
      workout,
    });
  });

  for (let weekdayIndex = 0; weekdayIndex < 7; weekdayIndex += 1) {
    if (activeDays.includes(weekdayIndex)) continue;
    const date = addDays(weekStart, weekdayIndex);
    days.push({
      key: dateKey(date),
      date,
      weekdayIndex,
      active: false,
      type: "recovery",
      label: "Recuperação ativa",
      badge: "Descanso",
      completed: Boolean(state.checkins[dateKey(date)]),
      workout: null,
    });
  }

  return days.sort((a, b) => a.weekdayIndex - b.weekdayIndex);
}

function buildPlan(profile) {
  const totalWeeks = profile.horizon === "monthly" ? 4 : 1;
  const weeks = [];

  for (let weekIndex = 0; weekIndex < totalWeeks; weekIndex += 1) {
    const phase = WEEK_PHASES[weekIndex] || WEEK_PHASES[WEEK_PHASES.length - 1];
    const days = buildWeeklyPattern(profile, weekIndex, totalWeeks);
    weeks.push({
      index: weekIndex,
      label: `Semana ${weekIndex + 1}`,
      phase,
      days,
    });
  }

  const activeDays = weeks.flatMap((week) => week.days.filter((day) => day.active)).length;
  return {
    id: `${Date.now()}`,
    createdAt: new Date().toISOString(),
    title: `${GOAL_LABELS[profile.goal] || "Misto"} · ${profile.horizon === "monthly" ? "mensal" : "semanal"}`,
    subtitle: GOAL_TONES[profile.goal] || GOAL_TONES.misto,
    weeks,
    activeDays,
    profileSnapshot: { ...profile },
  };
}

function calculateCompletion(plan, checkins) {
  if (!plan) return 0;
  const activeDays = plan.weeks.flatMap((week) => week.days.filter((day) => day.active));
  if (!activeDays.length) return 0;
  const completed = activeDays.filter((day) => Boolean(checkins[day.key])).length;
  return Math.round((completed / activeDays.length) * 100);
}

function calculateStreak(checkins) {
  const keys = Object.keys(checkins).sort();
  if (!keys.length) return 0;
  const last = dateFromKey(keys[keys.length - 1]);
  let streak = 0;
  let cursor = new Date(last);
  while (streak < 365) {
    const key = dateKey(cursor);
    if (!checkins[key]) break;
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function daysInactiveSinceLastWorkout(checkins) {
  const keys = Object.keys(checkins).sort();
  if (!keys.length) return null;
  const last = dateFromKey(keys[keys.length - 1]);
  const today = new Date();
  const diff = Math.floor((new Date(today.getFullYear(), today.getMonth(), today.getDate()) - new Date(last.getFullYear(), last.getMonth(), last.getDate())) / 86400000);
  return Math.max(0, diff);
}

function missedActiveDays(plan, checkins) {
  if (!plan) return 0;
  const today = new Date();
  return plan.weeks
    .flatMap((week) => week.days)
    .filter((day) => day.active && day.date <= today && !checkins[day.key]).length;
}

function nextPendingSession(plan, checkins) {
  if (!plan) return null;
  const sessions = plan.weeks.flatMap((week) => week.days.filter((day) => day.active));
  return sessions.find((day) => !checkins[day.key]) || null;
}

function buildAlerts() {
  const alerts = [];
  const streak = calculateStreak(state.checkins);
  const missed = missedActiveDays(state.plan, state.checkins);
  const inactiveDays = daysInactiveSinceLastWorkout(state.checkins);
  const next = nextPendingSession(state.plan, state.checkins);

  if (!state.plan) {
    alerts.push({
      tone: "success",
      title: "Pronto para gerar",
      text: "Complete o formulário e o motor cria o treino automaticamente.",
    });
    return alerts;
  }

  if (missed > 0) {
    alerts.push({
      tone: "danger",
      title: "Sessões em atraso",
      text: `Existem ${missed} dia(s) ativo(s) sem check-in. Faça uma sessão curta hoje e recupere a sequência.`,
    });
  } else {
    alerts.push({
      tone: "success",
      title: "Calendário alinhado",
      text: "Todos os dias ativos previstos já estão em dia ou ainda estão no futuro.",
    });
  }

  if (streak >= 3) {
    alerts.push({
      tone: "success",
      title: "Boa sequência",
      text: `Sequência atual de ${streak} check-in(s). Continue construindo consistência.`,
    });
  }

  if (inactiveDays !== null && inactiveDays >= 2) {
    alerts.push({
      tone: "danger",
      title: "Hora de voltar",
      text: `Você está há ${inactiveDays} dia(s) sem treinar. Escolha uma sessão curta hoje e volte ao trilho.`,
    });
  }

  if (next) {
    alerts.push({
      tone: "success",
      title: "Próxima missão",
      text: `${formatDateLabel(next.date, { weekday: "short", day: "2-digit", month: "short" })} · ${next.label}`,
    });
  }

  return alerts.slice(0, 4);
}

function renderFormState() {
  writeProfileToForm(state.profile);
}

function renderSummary() {
  if (!state.plan) {
    els.planSummary.innerHTML = `
      <strong>Preencha o formulário e gere o plano.</strong><br />
      O treino aparecerá aqui com divisão semanal ou mensal, detalhes de execução e check-in no calendário.
    `;
    els.planValue.textContent = "Sem plano";
    els.planMetaValue.textContent = "Nenhum ciclo ativo";
    els.nextWorkoutValue.textContent = "Gere um plano";
    els.heroSignal.textContent = "Preencha o formulário para criar um treino adaptado ao seu cenário.";
    return;
  }

  els.planSummary.innerHTML = `
    <strong>${state.plan.title}</strong><br />
    ${state.plan.subtitle}<br /><br />
    <strong>Perfil:</strong> ${GOAL_LABELS[state.profile.goal] || toTitleCase(state.profile.goal)} ·
    ${state.profile.location === "home" ? "Casa" : state.profile.location === "gym" ? "Academia" : "Híbrido"} ·
    ${state.profile.level} · ${state.profile.sessionTime} min
  `;
  els.planValue.textContent = GOAL_LABELS[state.profile.goal] || "Plano";
  els.planMetaValue.textContent = `${state.profile.daysPerWeek} dias/semana · ${state.profile.horizon === "monthly" ? "Mensal" : "Semanal"}`;

  const next = nextPendingSession(state.plan, state.checkins);
  els.nextWorkoutValue.textContent = next
    ? `${formatDateLabel(next.date, { weekday: "short", day: "2-digit", month: "short" })} · ${next.label}`
    : "Ciclo concluído";

  els.heroSignal.textContent = next
    ? `Próxima missão: ${next.label} em ${formatDateLabel(next.date, { weekday: "short", day: "2-digit", month: "short" })}. ${next.workout.note}`
    : "Todos os treinos ativos do ciclo já foram concluídos. Gere um novo plano ou aumente a meta.";
}

function renderWeekSwitch() {
  if (!state.plan) {
    els.weekSwitch.innerHTML = "";
    return;
  }

  els.selectedWeek = clamp(state.selectedWeek ?? 0, 0, state.plan.weeks.length - 1);
  els.weekSwitch.innerHTML = state.plan.weeks
    .map((week, index) => `<button class="week-tab ${index === state.selectedWeek ? "is-active" : ""}" data-week="${index}" type="button">${week.label}</button>`)
    .join("");
}

function renderPlan() {
  if (!state.plan) {
    els.planContainer.innerHTML = `<div class="empty-state">O sistema está aguardando os dados do formulário para gerar um ciclo completo.</div>`;
    return;
  }

  const week = state.plan.weeks[state.selectedWeek] || state.plan.weeks[0];
  if (!week) {
    els.planContainer.innerHTML = `<div class="empty-state">Nenhuma semana disponível.</div>`;
    return;
  }

  els.planContainer.innerHTML = week.days
    .map((day) => {
      if (!day.active) {
        return `
          <article class="day-card ${day.completed ? "is-complete" : ""}" data-day-key="${day.key}">
            <div class="day-top">
              <div>
                <div class="eyebrow">${formatDateLabel(day.date, { weekday: "short" })}</div>
                <h3>${formatDateLabel(day.date, { day: "2-digit", month: "short" })}</h3>
              </div>
              <span class="day-badge">Descanso</span>
            </div>
            <div class="day-summary">Dia de recuperação ativa. Caminhada leve, mobilidade e sono bem feito.</div>
            <div class="day-actions">
              <button class="ghost-btn" type="button" data-action="details" data-day-key="${day.key}">Detalhes</button>
            </div>
          </article>
        `;
      }

      const blocks = day.workout.blocks
        .map(
          (exercise) => `
            <article class="exercise-card">
              <div class="exercise-top">
                <div>
                  <h4>${exercise.name}</h4>
                  <p>${exercise.detail}</p>
                </div>
                <a href="${exercise.link}" target="_blank" rel="noreferrer">Como executar</a>
              </div>
              <div class="exercise-stats">
                <span class="stat-pill">${exercise.sets} séries</span>
                <span class="stat-pill">${exercise.reps}</span>
                <span class="stat-pill">Descanso ${exercise.rest}s</span>
                <span class="stat-pill">RPE ${exercise.rpe}</span>
                <span class="stat-pill">${exercise.tempo}</span>
              </div>
              <div class="exercise-note"><strong>Dica:</strong> ${exercise.cue}</div>
            </article>
          `
        )
        .join("");

      return `
        <article class="day-card ${day.completed ? "is-complete" : ""}" data-day-key="${day.key}">
          <div class="day-top">
            <div>
              <div class="eyebrow">${formatDateLabel(day.date, { weekday: "short" })}</div>
              <h3>${formatDateLabel(day.date, { day: "2-digit", month: "short" })}</h3>
            </div>
            <span class="day-badge">${day.completed ? "Concluído" : week.phase}</span>
          </div>
          <div class="day-meta">${day.label} · ${day.workout.duration} min · ${day.workout.objective}</div>
          <div class="day-summary">${day.workout.note}</div>
          <div class="day-blocks">
            ${blocks}
          </div>
          <div class="day-summary">
            <strong>Finalizador:</strong> ${day.workout.finisher.title}<br />
            ${day.workout.finisher.detail}
          </div>
          <div class="day-actions">
            <button class="primary-btn" type="button" data-action="checkin" data-day-key="${day.key}" ${state.checkins[day.key] ? "disabled" : ""}>
              ${state.checkins[day.key] ? "Concluído" : "Marcar check-in"}
            </button>
            <button class="ghost-btn" type="button" data-action="details" data-day-key="${day.key}">Detalhes</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderCalendar() {
  const anchor = state.plan ? state.plan.weeks[0].days[0].date : new Date();
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = addDays(startOfWeek(monthEnd), 6);
  const cells = [];
  const plannedDays = new Map(state.plan ? state.plan.weeks.flatMap((week) => week.days).map((day) => [day.key, day]) : []);
  const todayKey = dateKey(new Date());

  for (let cursor = new Date(gridStart); cursor <= gridEnd; cursor = addDays(cursor, 1)) {
    const key = dateKey(cursor);
    const planned = plannedDays.get(key);
    const completed = Boolean(state.checkins[key]);
    const muted = cursor.getMonth() !== monthStart.getMonth();
    const active = Boolean(planned?.active);
    let classes = "calendar-cell";
    if (muted) classes += " is-muted";
    if (active) classes += " is-active";
    if (completed) classes += " is-complete";
    if (active && !completed && cursor < new Date() && key !== todayKey) classes += " is-missed";

    cells.push(`
      <div class="${classes}">
        <div class="calendar-day">
          <span>${formatDateLabel(cursor, { weekday: "short", day: undefined, month: undefined })}</span>
          <strong>${pad(cursor.getDate())}</strong>
        </div>
        <div>${planned ? planned.label : "Livre"}</div>
        <div class="calendar-tag">${completed ? "Concluído" : active ? "Treino planejado" : "Recuperação"}</div>
      </div>
    `);
  }

  els.calendarInfo.innerHTML = `
    <strong>${formatMonthLabel(anchor)}</strong><br />
    ${state.plan ? `${state.plan.activeDays} sessões planejadas neste ciclo.` : "Gere um plano para preencher o calendário."}
  `;
  els.calendarGrid.innerHTML = cells.join("");
  els.calendarValue.textContent = state.plan ? `${state.plan.activeDays} treinos` : "0 treinos";
}

function renderAlerts() {
  const alerts = buildAlerts();
  els.alertsPanel.innerHTML = alerts
    .map(
      (alert) => `
        <div class="alert-card is-${alert.tone}">
          <strong>${alert.title}</strong>
          <div>${alert.text}</div>
        </div>
      `
    )
    .join("");
}

function renderLibrary() {
  const filtered = exerciseLibrary.filter((exercise) => {
    const profile = state.profile;
    const locationAllowed =
      profile.location === "hybrid" || exercise.modes.includes(profile.location) || exercise.modes.includes("hybrid");
    const equipmentAllowed =
      exercise.equipment.includes("none") || exercise.equipment.some((item) => profile.equipment.includes(item));
    return locationAllowed && equipmentAllowed;
  });

  const fallback = filtered.length ? filtered : exerciseLibrary;
  const items = fallback.slice(0, 12);

  els.libraryCountValue.textContent = `${items.length} exercícios`;
  els.libraryGrid.innerHTML = items
    .map(
      (exercise) => `
        <article class="library-card">
          <div class="library-top">
            <div>
              <div class="eyebrow">${exercise.tags.slice(0, 2).join(" · ")}</div>
              <h3>${exercise.name}</h3>
            </div>
            <span>${exercise.modes.join(" / ")}</span>
          </div>
          <p>${exercise.detail}</p>
          <div class="library-tags">
            ${exercise.tags.slice(0, 3).map((tag) => `<span class="chip">${toTitleCase(tag)}</span>`).join("")}
            ${exercise.muscles.slice(0, 2).map((muscle) => `<span class="chip">${muscle}</span>`).join("")}
          </div>
          <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.linkQuery)}" target="_blank" rel="noreferrer">Ver execução</a>
        </article>
      `
    )
    .join("");
}

function renderMetrics() {
  const completion = calculateCompletion(state.plan, state.checkins);
  const streak = calculateStreak(state.checkins);
  const sortedKeys = Object.keys(state.checkins).sort();
  const lastKey = sortedKeys[sortedKeys.length - 1];
  const lastDate = lastKey ? dateFromKey(lastKey) : null;
  const next = nextPendingSession(state.plan, state.checkins);

  els.completionValue.textContent = `${completion}%`;
  els.streakValue.textContent = `${streak} ${streak === 1 ? "dia" : "dias"}`;
  els.lastWorkoutValue.textContent = lastDate ? formatDateLabel(lastDate, { weekday: "short", day: "2-digit", month: "short" }) : "Sem check-in";
  const fbState = state.firebase || getFirebaseStatus();
  els.modeValue.textContent = fbState.enabled
    ? fbState.signedIn
      ? fbState.provider === "google.com"
        ? "Google · cloud"
        : "Anônimo · cloud"
      : "Firebase pronto"
    : "Local · offline";

  if (!state.plan) {
    els.heroSignal.textContent = "Preencha o formulário para criar um treino adaptado ao seu cenário.";
    els.nextWorkoutValue.textContent = "Gere um plano";
  } else if (next) {
    els.heroSignal.textContent = `Próxima missão: ${next.label} em ${formatDateLabel(next.date, { weekday: "short", day: "2-digit", month: "short" })}. ${next.workout.note}`;
    els.nextWorkoutValue.textContent = `${next.label} · ${formatDateLabel(next.date, { day: "2-digit", month: "short" })}`;
  } else {
    els.heroSignal.textContent = "Todos os treinos ativos do ciclo já foram concluídos. Gere um novo plano ou aumente a meta.";
    els.nextWorkoutValue.textContent = "Ciclo concluído";
  }
}

function renderIntegration() {
  const status = state.firebase || getFirebaseStatus();
  state.firebase = status;

  const summary =
    status.enabled && status.ready
      ? status.signedIn
        ? status.provider === "google.com"
          ? `Firebase ativo · Google ${getFirebaseUserEmail() || "conectado"}`
          : "Firebase ativo · sessão anônima"
        : "Firebase pronto · aguardando login"
      : "Firebase em modo local";

  if (els.firebaseStatusValue) {
    els.firebaseStatusValue.textContent = summary;
  }

  if (els.firebaseStatusFooter) {
    els.firebaseStatusFooter.textContent = status.reason || summary;
  }

  if (els.googleAuthBtn) {
    els.googleAuthBtn.textContent =
      status.enabled && status.signedIn && status.provider === "google.com" ? "Sair do Google" : "Entrar com Google";
  }

  if (els.paymentBtn) {
    els.paymentBtn.textContent = state.payment?.status === "paid_pending_review" ? "Pagamento enviado" : "Área de pagamento";
  }
}

async function syncCloudState() {
  const status = state.firebase || getFirebaseStatus();
  if (!status.enabled || !status.ready) return;

  const userId = getFirebaseUserId();
  if (!userId) return;

  await saveCoachState(userId, {
    profile: state.profile,
    plan: state.plan,
    checkins: state.checkins,
    payment: state.payment,
    selectedWeek: state.selectedWeek,
    view: state.view,
  });
}

async function hydrateFirebaseState() {
  const status = state.firebase || getFirebaseStatus();
  if (!status.enabled || !status.ready) {
    return;
  }

  const userId = getFirebaseUserId();
  if (!userId) {
    return;
  }

  const [remoteCoach, remotePayment] = await Promise.all([
    loadCoachState(userId),
    loadPaymentState(userId),
  ]);

  if (remoteCoach) {
    state.profile = { ...state.profile, ...(remoteCoach.profile || {}) };
    state.plan = remoteCoach.plan || state.plan;
    state.checkins = remoteCoach.checkins || state.checkins;
    state.payment = remoteCoach.payment || state.payment;
    state.selectedWeek = typeof remoteCoach.selectedWeek === "number" ? remoteCoach.selectedWeek : state.selectedWeek;
    state.view = remoteCoach.view || state.view;
  }

  if (remotePayment) {
    state.payment = { ...state.payment, ...remotePayment };
  }

  renderAll();
}

async function bootstrapFirebase() {
  if (firebaseBootstrapped) {
    await hydrateFirebaseState();
    return;
  }

  firebaseBootstrapped = true;
  const status = await initCoachFirebase();
  state.firebase = status;
  renderIntegration();

  if (!status.enabled || !status.ready) {
    return;
  }

  await hydrateFirebaseState();
}

function renderAll() {
  applyView();
  renderFormState();
  renderSummary();
  renderWeekSwitch();
  renderPlan();
  renderCalendar();
  renderAlerts();
  renderLibrary();
  renderMetrics();
  renderIntegration();
  saveState();
}

function openDayDialog(dayKey) {
  if (!state.plan) return;
  const day = state.plan.weeks.flatMap((week) => week.days).find((item) => item.key === dayKey);
  if (!day) return;

  els.dialogTag.textContent = day.active ? day.label : "Recuperação";
  els.dialogTitle.textContent = formatDateLabel(day.date, { weekday: "long", day: "2-digit", month: "long" });
  els.dialogSummary.textContent = day.active
    ? `${day.workout.objective} · ${day.workout.duration} minutos`
    : "Dia de recuperação ativa com baixo impacto e mobilidade.";

  const content = [];
  content.push(`
    <div class="dialog-section">
      <strong>Resumo</strong><br />
      ${day.active ? day.workout.note : "Caminhada leve, alongamento e hidratação."}
    </div>
  `);

  if (day.active) {
    content.push(`
      <div class="dialog-section">
        <strong>Aquecimento</strong><br />
        ${day.workout.warmup.map((item) => `• ${item}`).join("<br />")}
      </div>
    `);

    content.push(`
      <div class="dialog-section">
        <strong>Exercícios</strong><br />
        ${day.workout.blocks
          .map(
            (exercise) =>
              `• ${exercise.name} - ${exercise.sets} séries, ${exercise.reps}, descanso ${exercise.rest}s`
          )
          .join("<br />")}
      </div>
    `);

    content.push(`
      <div class="dialog-section">
        <strong>Finalizador</strong><br />
        ${day.workout.finisher.title}: ${day.workout.finisher.detail}
      </div>
    `);

    content.push(`
      <div class="dialog-section">
        <strong>Volta à calma</strong><br />
        ${day.workout.cooldown.map((item) => `• ${item}`).join("<br />")}
      </div>
    `);
  }

  els.dialogContent.innerHTML = content.join("");
  if (typeof els.dayDialog.showModal === "function") {
    els.dayDialog.showModal();
  }
}

function markCheckin(dayKey) {
  state.checkins[dayKey] = {
    completedAt: new Date().toISOString(),
  };
  renderAll();
  showToast("Check-in concluído. O calendário foi atualizado.");
  scrollToPlan();
}

function populateDemoProfile() {
  state.profile = {
    name: "Atleta Neon",
    age: 32,
    goal: "misto",
    horizon: "monthly",
    location: "hybrid",
    level: "intermediate",
    daysPerWeek: 5,
    sessionTime: 45,
    cardioStyle: "mixed",
    intensity: "high",
    equipment: ["dumbbells", "band", "bike"],
    focus: ["strength", "hypertrophy", "cardio", "mobility"],
    restrictions: "lombar sensível ocasionalmente",
    preferences: "Quero treinos intensos, com progressão e alertas se eu faltar.",
  };
  state.plan = buildPlan(state.profile);
  state.selectedWeek = 0;
  setView("dashboard", true);
  showToast("Exemplo premium carregado.");
  scrollToPlan();
}

function resetAll() {
  state.profile = createDefaultProfile();
  state.plan = null;
  state.checkins = {};
  state.payment = {
    status: "none",
    updatedAt: null,
    note: "",
  };
  state.selectedWeek = 0;
  state.view = "welcome";
  storageRemove(STORAGE_KEY);
  renderAll();
  window.scrollTo({ top: 0, behavior: "smooth" });
  showToast("Sistema resetado.");
}

function openPaymentDialog() {
  if (typeof els.paymentDialog?.showModal === "function") {
    els.paymentDialog.showModal();
  }
}

async function copyPixKey() {
  const pixKey = els.pixKeyValue?.textContent?.trim() || "00647011239";
  try {
    await navigator.clipboard.writeText(pixKey);
    showToast("Chave PIX copiada.");
  } catch {
    showToast("Não foi possível copiar a chave PIX.", "danger");
  }
}

async function markPaymentAsSent() {
  state.payment = {
    status: "paid_pending_review",
    updatedAt: new Date().toISOString(),
    note: "Cliente confirmou pagamento manualmente.",
  };
  renderAll();

  const userId = getFirebaseUserId();
  if (userId) {
    await savePaymentState(userId, {
      status: state.payment.status,
      note: state.payment.note,
      creator: "Mario Farias",
      pixKey: els.pixKeyValue?.textContent?.trim() || "00647011239",
    });

    await saveCoachState(userId, {
      profile: state.profile,
      plan: state.plan,
      checkins: state.checkins,
      payment: state.payment,
      selectedWeek: state.selectedWeek,
      view: state.view,
    });
  }

  els.paymentDialog?.close();
  showToast("Pagamento marcado para revisão.");
}

function wireEvents() {
  bindEquipmentExclusivity();

  els.coachForm.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      state.profile = readProfileFromForm();
      state.plan = buildPlan(state.profile);
      state.selectedWeek = 0;
      setView("dashboard", true);
      showToast("Treino gerado com sucesso.");
      scrollToPlan();
    } catch (error) {
      console.error("Falha ao gerar treino:", error);
      showToast("Não foi possível gerar o treino. Revise os campos.", "danger");
    }
  });

  els.generateBtn.addEventListener("click", () => {
    if (typeof els.coachForm.requestSubmit === "function") {
      els.coachForm.requestSubmit();
      return;
    }

    const submitButton = els.coachForm.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.click();
    }
  });

  els.googleAuthBtn?.addEventListener("click", async () => {
    const status = state.firebase || getFirebaseStatus();
    if (status.enabled && status.signedIn && status.provider === "google.com") {
      await signOutCoach();
      await hydrateFirebaseState();
      renderAll();
      showToast("Sessão do Google encerrada.");
      return;
    }

    await signInCoachWithGoogle();
    const postSignIn = state.firebase || getFirebaseStatus();
    if (!postSignIn.enabled) {
      renderAll();
      showToast("Ative o Firebase para usar login com Google.", "danger");
      return;
    }
    await hydrateFirebaseState();
    renderAll();
    showToast("Login do Google concluído.");
  });

  els.startJourneyBtn.addEventListener("click", () => {
    setView("form", true);
  });

  els.demoBtn.addEventListener("click", () => {
    populateDemoProfile();
  });

  els.backToWelcomeBtn.addEventListener("click", () => {
    setView("welcome", true);
  });

  els.editProfileBtn.addEventListener("click", () => {
    setView("form", true);
  });

  els.paymentBtn?.addEventListener("click", openPaymentDialog);
  els.copyPixBtn?.addEventListener("click", copyPixKey);
  els.paidBtn?.addEventListener("click", markPaymentAsSent);
  els.cancelPaymentBtn?.addEventListener("click", () => {
    els.paymentDialog?.close();
  });

  els.resetBtn.addEventListener("click", resetAll);

  els.weekSwitch.addEventListener("click", (event) => {
    const button = event.target.closest("[data-week]");
    if (!button || !state.plan) return;
    state.selectedWeek = Number(button.dataset.week);
    renderAll();
  });

  els.planContainer.addEventListener("click", (event) => {
    const checkButton = event.target.closest('[data-action="checkin"]');
    if (checkButton) {
      markCheckin(checkButton.dataset.dayKey);
      return;
    }

    const detailsButton = event.target.closest('[data-action="details"]');
    if (detailsButton) {
      openDayDialog(detailsButton.dataset.dayKey);
    }
  });

  els.dayDialog.addEventListener("click", (event) => {
    if (event.target?.hasAttribute("data-dialog-close")) {
      els.dayDialog.close();
    }
  });
}

function init() {
  writeProfileToForm(state.profile);
  wireEvents();
  onFirebaseStatusChange((status) => {
    state.firebase = status;
    renderIntegration();
  });
  if (state.plan) {
    state.view = state.view === "welcome" ? "dashboard" : state.view;
  } else if (state.view !== "form" && state.view !== "welcome") {
    state.view = "welcome";
  }
  renderAll();
  void bootstrapFirebase();
}

init();
