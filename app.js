import { getFirebaseStatus, getFirebaseUserId, initCoachFirebase, loadCoachState, saveCoachState } from "./firebase.js";

const STORAGE_KEY = "neon-coach-state-v1";
const CHECKIN_KEY = "neon-coach-checkins-v1";
const PROFILE_KEY = "neon-coach-profile-v1";
const PLAN_KEY = "neon-coach-plan-v1";
const CUSTOM_CONFIG_KEY = "neon-coach-config-v1";

const els = {
    appShell: document.getElementById("appShell"),
    coachForm: document.getElementById("coachForm"),
    generateBtn: document.getElementById("generateBtn"),
    demoBtn: document.getElementById("demoBtn"),
    resetBtn: document.getElementById("resetBtn"),
    toast: document.getElementById("toast"),
    planSummary: document.getElementById("planSummary"),
    planContainer: document.getElementById("planContainer"),
    weekSwitch: document.getElementById("weekSwitch"),
    calendarGrid: document.getElementById("calendarGrid"),
    calendarInfo: document.getElementById("calendarInfo"),
    alertsPanel: document.getElementById("alertsPanel"),
    libraryGrid: document.getElementById("libraryGrid"),
    firebaseStatus: document.getElementById("firebaseStatus"),
    coachSignal: document.getElementById("coachSignal"),
    streakValue: document.getElementById("streakValue"),
    completionValue: document.getElementById("completionValue"),
    planValue: document.getElementById("planValue"),
    lastWorkoutValue: document.getElementById("lastWorkoutValue"),
    nextFocusValue: document.getElementById("nextFocusValue"),
    modeValue: document.getElementById("modeValue"),
    dayCardTemplate: document.getElementById("dayCardTemplate"),
    exerciseCardTemplate: document.getElementById("exerciseCardTemplate"),
    libraryCardTemplate: document.getElementById("libraryCardTemplate"),
};

const exerciseLibrary = [
    {
        id: "agachamento",
        name: "Agachamento livre",
        focus: ["legs", "strength", "hypertrophy", "full"],
        modes: ["home", "gym", "hybrid"],
        equipment: ["none", "dumbbells", "barbell", "machines"],
        muscles: ["quadríceps", "glúteos", "core"],
        detail: "Desça controlando o tronco, mantenha o abdome travado e empurre o chão para subir.",
        cues: "Pense em sentar entre as pernas, não sobre as pernas.",
        search: "agachamento livre execucao correta",
        riskTags: ["knee"],
    },
    {
        id: "avanco",
        name: "Avanço alternado",
        focus: ["legs", "hypertrophy", "full"],
        modes: ["home", "gym", "hybrid"],
        equipment: ["none", "dumbbells"],
        muscles: ["glúteos", "quadríceps", "estabilidade"],
        detail: "Dê um passo amplo e desça com o joelho traseiro apontando para o chão.",
        cues: "Mantenha o tronco alto e o joelho da frente estável.",
        search: "avanco alternado execucao correta",
        riskTags: ["knee"],
    },
    {
        id: "flexao",
        name: "Flexão de braço",
        focus: ["push", "strength", "hypertrophy", "full"],
        modes: ["home", "gym", "hybrid"],
        equipment: ["none", "dumbbells", "band"],
        muscles: ["peito", "tríceps", "core"],
        detail: "Mãos firmes no chão, corpo alinhado e cotovelos levemente fechados.",
        cues: "Não deixe a lombar cair.",
        search: "flexao de braco execucao correta",
        riskTags: ["shoulder"],
    },
    {
        id: "flexao_inclinada",
        name: "Flexão inclinada",
        focus: ["push", "beginner", "full"],
        modes: ["home", "gym", "hybrid"],
        equipment: ["bench", "none"],
        muscles: ["peito", "tríceps", "core"],
        detail: "Apoie as mãos em superfície elevada para reduzir a alavanca.",
        cues: "Excelente para reintrodução de força em iniciantes.",
        search: "flexao inclinada execucao correta",
        riskTags: ["shoulder"],
    },
    {
        id: "pike",
        name: "Pike push-up",
        focus: ["push", "shoulders", "strength", "hypertrophy"],
        modes: ["home", "hybrid"],
        equipment: ["none"],
        muscles: ["ombros", "tríceps"],
        detail: "Quadril elevado, cabeça aponta para o chão e a força vem do ombro.",
        cues: "Ideal para progressão de desenvolvimento sem equipamento.",
        search: "pike push up execucao correta",
        riskTags: ["shoulder"],
    },
    {
        id: "ponte_gluteo",
        name: "Ponte de glúteo",
        focus: ["legs", "hypertrophy", "mobility", "full"],
        modes: ["home", "gym", "hybrid"],
        equipment: ["none", "band", "dumbbells", "barbell"],
        muscles: ["glúteos", "posterior de coxa"],
        detail: "Suba contraindo glúteos, sem hiperextender a lombar.",
        cues: "Pause 1 segundo no topo para aumentar a conexão mente-músculo.",
        search: "ponte de gluteo execucao correta",
        riskTags: ["lower_back"],
    },
    {
        id: "prancha",
        name: "Prancha frontal",
        focus: ["core", "mobility", "full"],
        modes: ["home", "gym", "hybrid"],
        equipment: ["none"],
        muscles: ["core", "estabilidade"],
        detail: "Antebraços no chão, glúteos ativos e costelas recolhidas.",
        cues: "Respiração curta e firme, sem prender o ar.",
        search: "prancha frontal execucao correta",
        riskTags: [],
    },
    {
        id: "dead_bug",
        name: "Dead bug",
        focus: ["core", "mobility", "full"],
        modes: ["home", "gym", "hybrid"],
        equipment: ["none"],
        muscles: ["core", "coordenação"],
        detail: "Mantenha lombar colada no chão enquanto alterna braço e perna.",
        cues: "Ótimo para proteger a lombar e ensinar controle corporal.",
        search: "dead bug exercicio execucao correta",
        riskTags: ["lower_back"],
    },
    {
        id: "burpee",
        name: "Burpee",
        focus: ["hiit", "cardio", "full"],
        modes: ["home", "gym", "hybrid"],
        equipment: ["none"],
        muscles: ["corpo inteiro"],
        detail: "Use como finalizador explosivo quando o objetivo for gasto calórico e potência.",
        cues: "Regule a intensidade se houver impacto excessivo.",
        search: "burpee execucao correta",
        riskTags: ["knee", "ankle", "shoulder"],
    },
    {
        id: "mountain_climber",
        name: "Mountain climber",
        focus: ["hiit", "cardio", "core", "full"],
        modes: ["home", "gym", "hybrid"],
        equipment: ["none"],
        muscles: ["core", "cardio"],
        detail: "Acelere os joelhos sem perder a posição de prancha.",
        cues: "Use como bloco de HIIT curto e intenso.",
        search: "mountain climber execucao correta",
        riskTags: ["wrist"],
    },
    {
        id: "jumping_jack",
        name: "Jumping jack",
        focus: ["cardio", "hiit", "full"],
        modes: ["home", "gym", "hybrid"],
        equipment: ["none"],
        muscles: ["condicionamento"],
        detail: "Movimento clássico para subir batimentos e entrar em calor.",
        cues: "Troque por versão sem salto se houver dor no impacto.",
        search: "jumping jack execucao correta",
        riskTags: ["ankle", "knee"],
    },
    {
        id: "corrida_estacionaria",
        name: "Corrida estacionária",
        focus: ["cardio", "running", "hiit"],
        modes: ["home", "gym", "hybrid"],
        equipment: ["none"],
        muscles: ["cardio", "coordenação"],
        detail: "Use frequência de passadas controlada para elevar o consumo energético.",
        cues: "Excelente substituto para corrida quando o espaço é limitado.",
        search: "corrida estacionaria execucao correta",
        riskTags: ["ankle", "knee"],
    },
    {
        id: "supino",
        name: "Supino reto",
        focus: ["push", "strength", "hypertrophy", "full"],
        modes: ["gym", "hybrid"],
        equipment: ["barbell", "dumbbells", "bench", "machines"],
        muscles: ["peito", "tríceps", "ombros"],
        detail: "Escápulas encaixadas, pés firmes e trajetória consistente da barra.",
        cues: "Base para força e hipertrofia no treino de membros superiores.",
        search: "supino reto execucao correta",
        riskTags: ["shoulder"],
    },
    {
        id: "remada",
        name: "Remada curvada",
        focus: ["pull", "strength", "hypertrophy", "full"],
        modes: ["gym", "hybrid"],
        equipment: ["barbell", "dumbbells", "band"],
        muscles: ["costas", "bíceps", "retração escapular"],
        detail: "Incline o tronco e puxe com o cotovelo, não apenas com a mão.",
        cues: "Mantenha a coluna neutra durante toda a série.",
        search: "remada curvada execucao correta",
        riskTags: ["lower_back"],
    },
    {
        id: "puxada",
        name: "Puxada alta",
        focus: ["pull", "strength", "hypertrophy", "full"],
        modes: ["gym"],
        equipment: ["machines"],
        muscles: ["costas", "bíceps"],
        detail: "Leve a barra até a linha superior do peito sem jogar o corpo para trás.",
        cues: "Pense em levar os cotovelos para baixo.",
        search: "puxada alta execucao correta",
        riskTags: ["shoulder"],
    },
    {
        id: "terra_romeno",
        name: "Terra romeno",
        focus: ["legs", "strength", "hypertrophy", "full"],
        modes: ["gym", "hybrid"],
        equipment: ["barbell", "dumbbells"],
        muscles: ["posterior de coxa", "glúteos", "lombar"],
        detail: "Hinge no quadril, canelas quase verticais e barra próxima do corpo.",
        cues: "Exercício excelente para cadeia posterior.",
        search: "levantamento terra romeno execucao correta",
        riskTags: ["lower_back"],
    },
    {
        id: "leg_press",
        name: "Leg press",
        focus: ["legs", "hypertrophy", "strength", "full"],
        modes: ["gym"],
        equipment: ["machines"],
        muscles: ["quadríceps", "glúteos"],
        detail: "Ajuste a amplitude sem perder a lombar colada no encosto.",
        cues: "Controle a fase excêntrica por 2 a 3 segundos.",
        search: "leg press execucao correta",
        riskTags: ["knee", "lower_back"],
    },
    {
        id: "desenvolvimento",
        name: "Desenvolvimento militar",
        focus: ["push", "strength", "hypertrophy", "full"],
        modes: ["gym", "hybrid"],
        equipment: ["dumbbells", "barbell"],
        muscles: ["ombros", "tríceps", "core"],
        detail: "Empurre acima da cabeça sem arquear excessivamente as costas.",
        cues: "Core forte reduz compensações lombares.",
        search: "desenvolvimento militar execucao correta",
        riskTags: ["shoulder", "lower_back"],
    },
    {
        id: "panturrilha",
        name: "Elevação de panturrilha",
        focus: ["legs", "hypertrophy", "full"],
        modes: ["home", "gym", "hybrid"],
        equipment: ["none", "dumbbells", "machines"],
        muscles: ["panturrilhas"],
        detail: "Suba totalmente e desça com controle, buscando amplitude máxima.",
        cues: "Segure 1 segundo no topo.",
        search: "elevacao de panturrilha execucao correta",
        riskTags: ["ankle"],
    },
    {
        id: "mobilidade_quadril",
        name: "Mobilidade de quadril",
        focus: ["mobility", "full"],
        modes: ["home", "gym", "hybrid"],
        equipment: ["none"],
        muscles: ["quadril", "tornozelo"],
        detail: "Sequência de abertura e rotação para melhorar agachamentos e passadas.",
        cues: "Use como aquecimento ou recuperação ativa.",
        search: "mobilidade de quadril exercicios",
        riskTags: [],
    },
    {
        id: "cat_cow",
        name: "Cat-cow",
        focus: ["mobility", "full"],
        modes: ["home", "gym", "hybrid"],
        equipment: ["none"],
        muscles: ["coluna"],
        detail: "Alterne flexão e extensão da coluna com respiração coordenada.",
        cues: "Ótimo para liberar a rigidez da manhã.",
        search: "cat cow exercicio execucao correta",
        riskTags: ["lower_back"],
    },
    {
        id: "caminhada",
        name: "Caminhada acelerada",
        focus: ["walking", "cardio", "endurance", "recovery"],
        modes: ["home", "gym", "hybrid"],
        equipment: ["none"],
        muscles: ["cardio", "recuperação"],
        detail: "Zona 2, ritmo contínuo e confortável para sustentar volume semanal.",
        cues: "Base excelente para queima calórica e saúde cardiovascular.",
        search: "caminhada acelerada beneficios e execucao",
        riskTags: ["ankle", "knee"],
    },
    {
        id: "corrida",
        name: "Corrida leve",
        focus: ["running", "cardio", "endurance"],
        modes: ["home", "gym", "hybrid"],
        equipment: ["none", "bike"],
        muscles: ["cardio", "pernas"],
        detail: "Cadência estável e respiração ritmada para construir resistência.",
        cues: "Perfeita para dias de zona 2 ou progressão de base aeróbica.",
        search: "corrida leve tecnicas de corrida",
        riskTags: ["ankle", "knee"],
    },
    {
        id: "bike",
        name: "Bike ergométrica",
        focus: ["cardio", "endurance", "recovery"],
        modes: ["gym", "hybrid"],
        equipment: ["bike"],
        muscles: ["cardio", "pernas"],
        detail: "Ideal para cardio de baixo impacto com controle de zona cardíaca.",
        cues: "Use para HIIT ou zona 2, conforme o objetivo.",
        search: "bike ergometrica treino hiit",
        riskTags: ["knee"],
    },
];

const storage = {
    read(key, fallback = null) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : fallback;
        } catch {
            return fallback;
        }
    },
    write(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },
    remove(key) {
        localStorage.removeItem(key);
    },
};

const state = {
    profile: storage.read(PROFILE_KEY, null) || getDefaultProfile(),
    plan: storage.read(PLAN_KEY, null),
    checkins: storage.read(CHECKIN_KEY, {}),
    selectedWeek: 0,
    firebaseEnabled: false,
    firebaseReady: false,
    firebaseReason: "Local first",
};

function getDefaultProfile() {
    return {
        name: "",
        age: 30,
        goal: "emagrecimento",
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
}

function toTitleCase(value) {
    return String(value)
        .replace(/[_-]/g, " ")
        .split(" ")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function formatDate(date) {
    return date.toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
    });
}

function formatDayNumber(date) {
    return date.getDate().toString().padStart(2, "0");
}

function formatMonthYear(date) {
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function addDays(date, amount) {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
}

function startOfWeek(date) {
    const next = new Date(date);
    const diff = (next.getDay() + 6) % 7;
    next.setDate(next.getDate() - diff);
    next.setHours(0, 0, 0, 0);
    return next;
}

function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function sameDay(a, b) {
    return a.toDateString() === b.toDateString();
}

function slugify(value) {
    return String(value)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "+")
        .replace(/(^\+|\+$)/g, "");
}

function youtubeSearchUrl(exerciseName) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `como executar ${exerciseName} corretamente`
    )}`;
}

function numberFromSelect(value) {
    return Number.parseInt(value, 10) || 0;
}

function unique(array) {
    return [...new Set(array)];
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
    const target = document.querySelector(".plan-panel");
    if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function readFormProfile() {
    const form = new FormData(els.coachForm);
    const equipment = form.getAll("equipment");
    const focus = form.getAll("focus");

    return {
        name: String(form.get("name") || "").trim(),
        age: numberFromSelect(form.get("age")),
        goal: String(form.get("goal") || "emagrecimento"),
        horizon: String(form.get("horizon") || "weekly"),
        location: String(form.get("location") || "home"),
        level: String(form.get("level") || "beginner"),
        daysPerWeek: numberFromSelect(form.get("daysPerWeek")) || 5,
        sessionTime: numberFromSelect(form.get("sessionTime")) || 45,
        cardioStyle: String(form.get("cardioStyle") || "mixed"),
        intensity: String(form.get("intensity") || "high"),
        equipment: equipment.length ? equipment : ["none"],
        focus: focus.length ? focus : ["strength", "hypertrophy"],
        restrictions: String(form.get("restrictions") || "").trim(),
        preferences: String(form.get("preferences") || "").trim(),
    };
}

function writeProfileToForm(profile) {
    const values = profile || getDefaultProfile();
    Object.entries(values).forEach(([key, value]) => {
        const field = els.coachForm.elements.namedItem(key);
        if (!field) return;
        if (field instanceof RadioNodeList) return;
        if (field.type === "checkbox") return;
        field.value = value;
    });

    const equipmentInputs = [...els.coachForm.querySelectorAll('input[name="equipment"]')];
    equipmentInputs.forEach((input) => {
        input.checked = values.equipment?.includes(input.value) || false;
    });

    const focusInputs = [...els.coachForm.querySelectorAll('input[name="focus"]')];
    focusInputs.forEach((input) => {
        input.checked = values.focus?.includes(input.value) || false;
    });
}

function levelSettings(level) {
    if (level === "advanced") {
        return { sets: 5, reps: "6-10", rest: 75, tempo: "3-1-1", rpe: 8.5, volume: 1.1 };
    }

    if (level === "intermediate") {
        return { sets: 4, reps: "8-12", rest: 90, tempo: "2-1-1", rpe: 8, volume: 1 };
    }

    return { sets: 3, reps: "10-15", rest: 105, tempo: "2-0-2", rpe: 7, volume: 0.85 };
}

function resolveWorkoutPrescription(profile, type) {
    const base = levelSettings(profile.level);
    const prescription = { ...base };

    if (profile.goal === "forca") {
        Object.assign(prescription, { sets: 5, reps: "4-6", rest: 120, tempo: "3-1-1", rpe: 8.5 });
    } else if (profile.goal === "hipertrofia") {
        Object.assign(prescription, { sets: 4, reps: "8-12", rest: 75, tempo: "2-1-1", rpe: 8 });
    } else if (profile.goal === "emagrecimento") {
        Object.assign(prescription, { sets: 3, reps: "12-15", rest: 45, tempo: "2-0-2", rpe: 8 });
    } else if (profile.goal === "resistencia") {
        Object.assign(prescription, { sets: 3, reps: "15-20", rest: 30, tempo: "2-0-1", rpe: 7.5 });
    } else if (profile.goal === "corrida") {
        Object.assign(prescription, { sets: 2, reps: "20-40 min", rest: 0, tempo: "zona 2", rpe: 6.5 });
    } else if (profile.goal === "caminhada") {
        Object.assign(prescription, { sets: 1, reps: "30-50 min", rest: 0, tempo: "zona 2", rpe: 4.5 });
    } else if (profile.goal === "mobilidade") {
        Object.assign(prescription, { sets: 2, reps: "8-10 por lado", rest: 20, tempo: "controlado", rpe: 5.5 });
    }

    if (type === "conditioning" || type === "intervals") {
        Object.assign(prescription, {
            sets: profile.sessionTime <= 30 ? 3 : 4,
            reps: type === "intervals" ? "30s forte / 30s leve" : "40s forte / 20s leve",
            rest: 20,
            tempo: "explosivo",
            rpe: 8.8,
        });
    }

    if (type === "mobility") {
        Object.assign(prescription, {
            sets: 2,
            reps: "8-12 por lado",
            rest: 15,
            tempo: "controlado",
            rpe: 5,
        });
    }

    if (type === "run") {
        Object.assign(prescription, {
            sets: 1,
            reps: profile.cardioStyle === "hiit" ? "8-12 tiros" : profile.sessionTime >= 45 ? "30-45 min" : "20-30 min",
            rest: profile.cardioStyle === "hiit" ? 45 : 0,
            tempo: profile.cardioStyle === "hiit" ? "intervalado" : "zona 2",
            rpe: profile.cardioStyle === "hiit" ? 8.5 : 6.5,
        });
    }

    if (type === "walk") {
        Object.assign(prescription, {
            sets: 1,
            reps: profile.sessionTime >= 45 ? "40-60 min" : "25-40 min",
            rest: 0,
            tempo: "zona 2",
            rpe: 4.5,
        });
    }

    if (type === "core") {
        Object.assign(prescription, {
            sets: 3,
            reps: "30-45s",
            rest: 20,
            tempo: "estável",
            rpe: 6.5,
        });
    }

    return prescription;
}

function goalTone(goal) {
    switch (goal) {
        case "emagrecimento":
            return "Foco em gasto calórico, densidade de treino e cardio inteligente.";
        case "hipertrofia":
            return "Volume alto, controle de execução e progressão de carga semanal.";
        case "forca":
            return "Baixas repetições, maior descanso e padrões compostos prioritários.";
        case "resistencia":
            return "Construção aeróbica, tolerância ao volume e blocos contínuos.";
        case "corrida":
            return "Progressão de base, técnica de corrida e controle de intensidade.";
        case "caminhada":
            return "Zona 2, consistência diária e recuperação ativa entre sessões.";
        case "mobilidade":
            return "Controle articular, liberação de rigidez e estabilidade de tronco.";
        default:
            return "Treino híbrido com força, condicionamento e mobilidade.";
    }
}

function planLabel(profile) {
    const horizon = profile.horizon === "monthly" ? "mensal" : "semanal";
    return `${toTitleCase(profile.goal)} · ${horizon}`;
}

function isExerciseAllowed(exercise, profile) {
    if (profile.location === "home" && !exercise.modes.includes("home") && !exercise.modes.includes("hybrid")) {
        return false;
    }

    if (profile.location === "gym" && !exercise.modes.includes("gym") && !exercise.modes.includes("hybrid")) {
        return false;
    }

    const hasEquipment = new Set(profile.equipment || []);
    const equipmentOk = exercise.equipment.some((equipment) => hasEquipment.has(equipment) || hasEquipment.has("none"));
    if (!equipmentOk && !exercise.equipment.includes("none")) {
        return false;
    }

    const restrictions = String(profile.restrictions || "").toLowerCase();
    const tags = exercise.riskTags || [];

    if (restrictions.includes("joelho") && tags.some((tag) => ["knee", "ankle", "jump"].includes(tag))) return false;
    if (restrictions.includes("ombro") && tags.includes("shoulder")) return false;
    if (restrictions.includes("lombar") && tags.includes("lower_back")) return false;
    if (restrictions.includes("tornozelo") && tags.some((tag) => ["ankle", "jump"].includes(tag))) return false;

    return true;
}

function filterExercises(profile, tags = []) {
    return exerciseLibrary.filter((exercise) => {
        if (!isExerciseAllowed(exercise, profile)) return false;

        const include = tags.length === 0 || tags.some((tag) => exercise.focus.includes(tag));
        return include;
    });
}

function pickMany(list, count, offset = 0) {
    if (!list.length) return [];
    const chosen = [];
    for (let index = 0; index < Math.min(count, list.length); index += 1) {
        chosen.push(list[(index + offset) % list.length]);
    }
    return chosen;
}

function buildActiveSessionTypes(profile) {
    const goal = profile.goal;
    const days = profile.daysPerWeek;

    if (goal === "mobilidade") {
        return Array.from({ length: days }, (_, index) => (index % 2 === 0 ? "mobility" : "core"));
    }

    if (goal === "corrida") {
        if (days >= 6) return ["run", "strength", "intervals", "run", "mobility", "walk"];
        if (days === 5) return ["run", "strength", "intervals", "run", "mobility"];
        if (days === 4) return ["run", "strength", "intervals", "mobility"];
        return ["run", "strength", "run"];
    }

    if (goal === "caminhada") {
        if (days >= 6) return ["walk", "strength", "walk", "mobility", "walk", "strength"];
        if (days === 5) return ["walk", "strength", "walk", "mobility", "walk"];
        if (days === 4) return ["walk", "strength", "walk", "mobility"];
        return ["walk", "strength", "walk"];
    }

    if (goal === "forca") {
        if (days >= 6) return ["lower", "push", "pull", "lower", "upper", "full"];
        if (days === 5) return ["lower", "push", "pull", "lower", "upper"];
        if (days === 4) return ["lower", "push", "pull", "lower"];
        return ["full", "lower", "upper"];
    }

    if (goal === "hipertrofia") {
        if (days >= 6) return ["push", "pull", "legs", "upper", "lower", "conditioning"];
        if (days === 5) return ["push", "pull", "legs", "upper", "lower"];
        if (days === 4) return ["push", "pull", "legs", "upper"];
        return ["full", "upper", "lower"];
    }

    if (goal === "emagrecimento") {
        if (days >= 6) return ["full", "conditioning", "lower", "upper", "intervals", "mobility"];
        if (days === 5) return ["full", "conditioning", "lower", "upper", "intervals"];
        if (days === 4) return ["full", "conditioning", "lower", "mobility"];
        return ["full", "conditioning", "full"];
    }

    if (goal === "resistencia") {
        if (days >= 6) return ["conditioning", "run", "strength", "conditioning", "walk", "mobility"];
        if (days === 5) return ["conditioning", "run", "strength", "conditioning", "mobility"];
        if (days === 4) return ["conditioning", "run", "strength", "mobility"];
        return ["conditioning", "run", "strength"];
    }

    if (days <= 3) return ["full", "full", "conditioning"];
    if (days === 4) return ["upper", "lower", "conditioning", "upper"];
    if (days === 5) return ["push", "pull", "legs", "conditioning", "upper"];
    if (days === 6) return ["push", "pull", "legs", "conditioning", "upper", "lower"];
    return ["push", "pull", "legs", "conditioning", "upper", "lower", "mobility"];
}

function dayPatternForIndex(profile, index) {
    const types = buildActiveSessionTypes(profile);
    const activeDays = [];
    const daysPerWeek = Math.max(1, Math.min(7, profile.daysPerWeek));

    if (daysPerWeek === 3) activeDays.push(1, 3, 5);
    else if (daysPerWeek === 4) activeDays.push(1, 2, 4, 6);
    else if (daysPerWeek === 5) activeDays.push(1, 2, 3, 5, 6);
    else if (daysPerWeek === 6) activeDays.push(1, 2, 3, 4, 5, 6);
    else activeDays.push(0, 1, 2, 3, 4, 5, 6);

    const weekday = index % 7;
    const activeIndex = activeDays.indexOf(weekday);

    if (activeIndex === -1) {
        return { type: "recovery", label: "Recuperação ativa", intensity: "leve" };
    }

    const type = types[activeIndex % types.length] || "full";
    return { type, label: toTitleCase(type), intensity: "treino" };
}

function buildWorkoutBlock(profile, type, weekIndex, dayIndex) {
    const prescription = resolveWorkoutPrescription(profile, type);
    const focusTags = {
        push: ["push"],
        pull: ["pull"],
        legs: ["legs"],
        upper: ["push", "pull"],
        lower: ["legs"],
        full: ["push", "pull", "legs", "core", "cardio"],
        conditioning: ["cardio", "hiit", "full"],
        mobility: ["mobility", "full"],
        core: ["core", "mobility"],
        run: ["running", "cardio", "endurance"],
        walk: ["walking", "cardio", "recovery"],
        intervals: ["hiit", "cardio"],
    };

    const pool = filterExercises(profile, focusTags[type] || ["full"]);
    const setsMultiplier = 1 + weekIndex * 0.08;
    const shuffledOffset = (weekIndex * 3 + dayIndex * 2) % Math.max(1, pool.length);
    const exerciseCount = profile.sessionTime <= 25 ? 3 : profile.sessionTime <= 40 ? 4 : 5;
    const selected = pickMany(pool, type === "conditioning" || type === "mobility" || type === "run" || type === "walk" ? 3 : exerciseCount, shuffledOffset);
    const intensityBoost = profile.intensity === "very_high" ? 1.1 : profile.intensity === "high" ? 1 : 0.92;

    const warmup = [
        "Mobilidade articular por 3 min",
        "Respiração nasal e ativação do core",
        "Série leve do primeiro exercício",
    ];

    const blocks = selected.map((exercise, exerciseIndex) => {
        const baseSets = prescription.sets;
        const adaptiveSets = Math.max(2, Math.round(baseSets * setsMultiplier * intensityBoost));
        let reps = prescription.reps;
        let rest = prescription.rest;
        let tempo = prescription.tempo;
        let note = exercise.detail;

        if (type === "conditioning" || exercise.focus.includes("cardio") || exercise.focus.includes("hiit")) {
            reps = prescription.reps;
            rest = prescription.rest;
            tempo = prescription.tempo;
        }

        if (type === "mobility") {
            reps = prescription.reps;
            rest = prescription.rest;
            tempo = prescription.tempo;
        }

        if (type === "run") {
            reps = prescription.reps;
            rest = prescription.rest;
            tempo = prescription.tempo;
            note = "Mantenha um ritmo conversável e monitore a respiração.";
        }

        if (type === "walk") {
            reps = prescription.reps;
            rest = prescription.rest;
            tempo = prescription.tempo;
            note = "Caminhada vigorosa em terreno plano ou leve inclinação.";
        }

        return {
            id: `${exercise.id}-${weekIndex}-${dayIndex}-${exerciseIndex}`,
            name: exercise.name,
            sets: adaptiveSets,
            reps,
            rest,
            tempo,
            rpe: prescription.rpe,
            note,
            cue: exercise.cues,
            muscles: exercise.muscles,
            detail: exercise.detail,
            link: youtubeSearchUrl(exercise.name),
            search: exercise.search,
        };
    });

    let finisher = null;

    if (type === "conditioning" || type === "intervals") {
        finisher = {
            title: "Finalizador metabólico",
            detail:
                profile.cardioStyle === "run"
                    ? "6 tiros de 20 segundos de corrida forte / 40 segundos leves."
                    : "Circuito de 4 minutos com mountain climber, polichinelo e burpee sem descanso.",
            link: youtubeSearchUrl(profile.cardioStyle === "run" ? "sprint interval training" : "treino hiit circuito"),
        };
    } else if (type === "full") {
        finisher = {
            title: "Finalizador técnico",
            detail: "Prancha + dead bug + mobilidade de quadril por 6 minutos.",
            link: youtubeSearchUrl("core training plank dead bug"),
        };
    } else if (type === "mobility") {
        finisher = {
            title: "Reset de recuperação",
            detail: "Sequência de respiração, cat-cow e mobilidade torácica por 8 minutos.",
            link: youtubeSearchUrl("mobilidade quadril coluna toracica"),
        };
    }

    return {
        type,
        title: toTitleCase(type).replace(/_/g, " "),
        warmup,
        blocks,
        finisher,
        duration: profile.sessionTime,
        notes: [
            goalTone(profile.goal),
            profile.preferences || "Personalização automática aplicada.",
        ],
    };
}

function buildWeek(profile, weekIndex = 0) {
    const start = addDays(startOfWeek(new Date()), weekIndex * 7);
    const rows = [];

    for (let index = 0; index < 7; index += 1) {
        const date = addDays(start, index);
        const pattern = dayPatternForIndex(profile, index);
        const active = pattern.type !== "recovery";
        const workout = active ? buildWorkoutBlock(profile, pattern.type, weekIndex, index) : null;

        rows.push({
            id: `${weekIndex}-${index}-${date.toISOString().slice(0, 10)}`,
            date,
            active,
            type: pattern.type,
            label: pattern.label,
            intensity: pattern.intensity,
            workout,
            completed: Boolean(state.checkins[date.toISOString().slice(0, 10)]),
        });
    }

    return rows;
}

function buildPlan(profile) {
    const weeks = profile.horizon === "monthly" ? 4 : 1;
    const generated = [];

    for (let weekIndex = 0; weekIndex < weeks; weekIndex += 1) {
        generated.push({
            weekIndex,
            label: weekIndex === 3 ? "Semana 4 - Deload e consolidação" : `Semana ${weekIndex + 1}`,
            focus: weekIndex === 3 ? "Redução de carga para recuperar e consolidar ganhos." : goalTone(profile.goal),
            rows: buildWeek(profile, weekIndex),
        });
    }

    return {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
        createdAt: new Date().toISOString(),
        profile,
        horizon: profile.horizon,
        weeks: generated,
        title: planLabel(profile),
        summary: `${goalTone(profile.goal)} Plano ${profile.horizon === "monthly" ? "mensal" : "semanal"} com ${profile.daysPerWeek} dias por semana.`,
    };
}

function saveLocalState() {
    storage.write(PROFILE_KEY, state.profile);
    storage.write(PLAN_KEY, state.plan);
    storage.write(CHECKIN_KEY, state.checkins);
    storage.write(STORAGE_KEY, {
        profile: state.profile,
        plan: state.plan,
        checkins: state.checkins,
    });
}

async function syncRemoteState() {
    const userId = getFirebaseUserId();
    if (!userId) return;

    await saveCoachState(userId, {
        profile: state.profile,
        plan: state.plan,
        checkins: state.checkins,
    });
}

function applyProfile(profile) {
    state.profile = profile;
    writeProfileToForm(profile);
    saveLocalState();
}

function renderWeekSwitch() {
    if (!state.plan) {
        els.weekSwitch.innerHTML = "";
        return;
    }

    els.weekSwitch.innerHTML = state.plan.weeks
        .map(
            (week, index) =>
                `<button class="week-tab ${index === state.selectedWeek ? "is-active" : ""}" data-week="${index}" type="button">${week.label}</button>`
        )
        .join("");

    els.weekSwitch.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", () => {
            state.selectedWeek = Number(button.dataset.week);
            renderAll();
        });
    });
}

function renderExerciseCard(exercise) {
    const node = els.exerciseCardTemplate.content.cloneNode(true);
    const card = node.querySelector(".exercise-card");
    node.querySelector("h4").textContent = exercise.name;
    node.querySelector("p").textContent = exercise.detail;
    const link = node.querySelector("a");
    link.href = exercise.link;
    link.textContent = "Como executar";
    const stats = node.querySelector(".exercise-stats");
    stats.innerHTML = [
        `<span class="stat-pill">${exercise.sets} séries</span>`,
        `<span class="stat-pill">${exercise.reps} reps</span>`,
        `<span class="stat-pill">Descanso ${exercise.rest}s</span>`,
        `<span class="stat-pill">RPE ${exercise.rpe}</span>`,
        `<span class="stat-pill">${exercise.tempo}</span>`,
    ].join("");
    node.querySelector(".exercise-note").innerHTML = `
    <strong>Dica:</strong> ${exercise.cue}<br />
    <strong>Foco:</strong> ${unique(exercise.muscles).join(" · ")}
  `;
    return card;
}

function renderDayCard(day) {
    const node = els.dayCardTemplate.content.cloneNode(true);
    const card = node.querySelector(".day-card");
    const title = node.querySelector("h3");
    const label = node.querySelector(".day-label");
    const badge = node.querySelector(".day-badge");
    const meta = node.querySelector(".day-meta");
    const blocks = node.querySelector(".day-blocks");
    const checkinBtn = node.querySelector(".checkin-btn");
    const detailsBtn = node.querySelector(".details-btn");

    title.textContent = formatDate(day.date);
    label.textContent = day.active ? day.label : "Recovery day";
    badge.textContent = day.completed ? "Concluído" : day.active ? "Pendente" : "Recuperação";
    meta.textContent = `${day.intensity} · ${day.date.toLocaleDateString("pt-BR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    })}`;

    if (!day.active) {
        blocks.innerHTML = `<div class="empty-state">Dia de recuperação ativa. Caminhada leve, mobilidade ou descanso.</div>`;
        checkinBtn.textContent = "Registrar recuperação";
    } else {
        blocks.innerHTML = "";
        day.workout.blocks.forEach((exercise) => {
            blocks.appendChild(renderExerciseCard(exercise));
        });
    }

    if (day.completed) card.classList.add("is-complete");
    if (day.active && isMissedDay(day.date)) card.classList.add("is-missed");

    checkinBtn.addEventListener("click", async () => {
        markCheckin(day.date);
        await persistState();
        renderAll();
    });

    detailsBtn.addEventListener("click", () => {
        const details = day.active
            ? `${day.workout.title}. ${day.workout.notes.join(" ")}`
            : "Dia de recuperação focado em mobilidade, caminhada leve e reposição energética.";
        alert(details);
    });

    return card;
}

function isMissedDay(date) {
    const today = new Date();
    const key = date.toISOString().slice(0, 10);
    return date < new Date(today.toDateString()) && !state.checkins[key] && date <= today;
}

function markCheckin(date) {
    const key = date.toISOString().slice(0, 10);
    state.checkins[key] = {
        completedAt: new Date().toISOString(),
        label: formatDate(date),
    };

    state.profile.lastCheckin = key;
    storage.write(CHECKIN_KEY, state.checkins);
    saveLocalState();
}

function calculateStreak() {
    const dates = Object.keys(state.checkins).sort();
    if (!dates.length) return 0;

    const today = new Date();
    let streak = 0;
    let cursor = new Date(today);

    while (streak < 365) {
        const key = cursor.toISOString().slice(0, 10);
        if (state.checkins[key]) {
            streak += 1;
            cursor = addDays(cursor, -1);
            continue;
        }
        if (cursor > today) {
            cursor = addDays(cursor, -1);
            continue;
        }
        break;
    }

    return streak;
}

function calculateCompletion(plan) {
    if (!plan) return 0;

    const allActive = plan.weeks.flatMap((week) => week.rows.filter((row) => row.active));
    if (!allActive.length) return 0;

    const completed = allActive.filter((day) => state.checkins[day.date.toISOString().slice(0, 10)]).length;
    return Math.round((completed / allActive.length) * 100);
}

function buildAlerts() {
    const alerts = [];
    const streak = calculateStreak();
    const lastCheckinKey = Object.keys(state.checkins).sort().slice(-1)[0];
    const lastCheckinDate = lastCheckinKey ? new Date(lastCheckinKey) : null;
    const daysInactive = lastCheckinDate ? Math.max(0, Math.floor((Date.now() - lastCheckinDate.getTime()) / 86400000)) : null;

    if (state.plan) {
        const missed = state.plan.weeks
            .flatMap((week) => week.rows)
            .filter((day) => day.active && isMissedDay(day.date))
            .slice(-3);

        if (missed.length) {
            alerts.push({
                kind: "danger",
                title: "Sequência quebrada detectada",
                text: `Você tem ${missed.length} treino(s) ativo(s) sem check-in recente. O sistema recomenda uma volta curta hoje: 15 a 20 minutos, foco em consistência.`,
            });
        } else {
            alerts.push({
                kind: "success",
                title: "Plano em movimento",
                text: "O calendário está alinhado. Mantenha o ritmo e siga a progressão planejada.",
            });
        }
    }

    if (streak >= 3) {
        alerts.push({
            kind: "success",
            title: "Boa sequência",
            text: `Sequência atual de ${streak} dias. Você está criando identidade de atleta.`,
        });
    }

    if (daysInactive !== null && daysInactive >= 2) {
        alerts.push({
            kind: "danger",
            title: "Hora de voltar",
            text: `Você está há ${daysInactive} dia(s) sem treinar. Faça hoje uma sessão reduzida, mas não perca o hábito.`,
        });
    }

    if (!alerts.length) {
        alerts.push({
            kind: "success",
            title: "Pronto para iniciar",
            text: "Gere seu plano e comece com a primeira sessão agora. O coach vai ajustar o restante automaticamente.",
        });
    }

    return alerts;
}

function renderAlerts() {
    els.alertsPanel.innerHTML = buildAlerts()
        .map(
            (alert) => `
        <div class="alert-card is-${alert.kind}">
          <strong>${alert.title}</strong>
          <div>${alert.text}</div>
        </div>
      `
        )
        .join("");
}

function renderCalendar() {
    if (!state.plan) {
        els.calendarInfo.textContent = "Gere um plano para visualizar o calendário de check-ins.";
        els.calendarGrid.innerHTML = "";
        return;
    }

    const firstWeek = state.plan.weeks[0];
    const monthDate = firstWeek?.rows[0]?.date || new Date();
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const start = new Date(monthStart);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const end = new Date(monthEnd);
    end.setDate(end.getDate() + (6 - ((end.getDay() + 6) % 7)));

    const infoText = `${formatMonthYear(monthDate)} · ${state.plan.title} · ${state.profile.daysPerWeek} treino(s) por semana`;
    els.calendarInfo.innerHTML = infoText;

    const cells = [];
    const scheduleDays = state.plan.weeks.flatMap((week) => week.rows);
    const scheduleMap = new Map(scheduleDays.map((day) => [day.date.toISOString().slice(0, 10), day]));

    for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, 1)) {
        const key = cursor.toISOString().slice(0, 10);
        const planned = scheduleMap.get(key);
        const completed = Boolean(state.checkins[key]);
        const isMuted = cursor.getMonth() !== monthDate.getMonth();

        let className = "calendar-cell";
        if (isMuted) className += " is-muted";
        if (planned?.active) className += " is-active";
        if (completed) className += " is-complete";
        if (planned?.active && !completed && cursor < new Date(new Date().toDateString())) className += " is-missed";

        cells.push(`
      <div class="${className}">
        <div class="calendar-day">
          <span class="calendar-title">${cursor.toLocaleDateString("pt-BR", { weekday: "short" })}</span>
          <span>${formatDayNumber(cursor)}</span>
        </div>
        <div>${planned ? planned.label : "Fora do ciclo"}</div>
        <div class="calendar-tag">
          ${completed ? "Concluído" : planned?.active ? "Treino planejado" : "Recuperação"}
        </div>
      </div>
    `);
    }

    els.calendarGrid.innerHTML = cells.join("");
}

function renderLibrary() {
    const filtered = exerciseLibrary.filter((exercise) => isExerciseAllowed(exercise, state.profile));
    els.libraryGrid.innerHTML = "";

    filtered.slice(0, 12).forEach((exercise) => {
        const node = els.libraryCardTemplate.content.cloneNode(true);
        node.querySelector("h4").textContent = exercise.name;
        node.querySelector("span").textContent = exercise.modes.join(" / ");
        node.querySelector("p").textContent = exercise.detail;
        const tags = node.querySelector(".library-tags");
        tags.innerHTML = [
            ...exercise.focus.slice(0, 3).map((item) => `<span class="chip">${toTitleCase(item)}</span>`),
            ...exercise.muscles.slice(0, 2).map((item) => `<span class="chip">${item}</span>`),
        ].join("");
        const link = node.querySelector("a");
        link.href = youtubeSearchUrl(exercise.name);
        link.textContent = "Ver execução";
        els.libraryGrid.appendChild(node);
    });
}

function renderPlan() {
    if (!state.plan) {
        els.planSummary.innerHTML = `
      <strong>Preencha o formulário e gere um plano inteligente.</strong><br />
      Quando o formulário for enviado, o treino semanal ou mensal aparece aqui com a divisão exata.
    `;
        els.planContainer.innerHTML = `<div class="empty-state">O coach está esperando suas respostas para entregar o treino ideal.</div>`;
        els.planValue.textContent = "Sem plano";
        els.nextFocusValue.textContent = "Gere um plano";
        return;
    }

    const selectedWeek = state.plan.weeks[state.selectedWeek] || state.plan.weeks[0];
    els.planSummary.innerHTML = `
    <strong>${state.plan.title}</strong><br />
    ${state.plan.summary}<br />
    <br />
    <strong>Perfil:</strong> ${state.profile.location === "home" ? "Casa" : state.profile.location === "gym" ? "Academia" : "Híbrido"} · 
    ${toTitleCase(state.profile.level)} · ${state.profile.sessionTime} min por sessão
  `;

    els.planContainer.innerHTML = "";
    selectedWeek.rows.forEach((day) => {
        els.planContainer.appendChild(renderDayCard(day));
    });
    els.planValue.textContent = state.plan.title;
    els.nextFocusValue.textContent = selectedWeek.rows.find((day) => day.active)?.label || "Recuperação";
}

function updateMetrics() {
    const streak = calculateStreak();
    const completion = calculateCompletion(state.plan);
    const lastCheckinKey = Object.keys(state.checkins).sort().slice(-1)[0];

    els.streakValue.textContent = `${streak} dia${streak === 1 ? "" : "s"}`;
    els.completionValue.textContent = `${completion}%`;
    els.lastWorkoutValue.textContent = lastCheckinKey ? formatDate(new Date(lastCheckinKey)) : "Sem check-in";
    els.modeValue.textContent = state.firebaseEnabled && state.firebaseReady ? "Firebase ativo" : "Local first";

    if (state.plan) {
        const firstActive = state.plan.weeks.flatMap((week) => week.rows).find((day) => day.active && !state.checkins[day.date.toISOString().slice(0, 10)]);
        els.coachSignal.textContent = firstActive
            ? `Próxima missão: ${firstActive.label} em ${formatDate(firstActive.date)}. ${firstActive.workout?.notes?.[0] || ""}`
            : "Todos os treinos planejados já foram concluídos. Gere um novo ciclo ou aumente a meta.";
    } else {
        els.coachSignal.textContent = "O coach está aguardando seu formulário para criar o protocolo ideal.";
    }
}

async function persistState() {
    saveLocalState();
    await syncRemoteState();
}

function renderFirebaseStatus() {
    const status = getFirebaseStatus();
    state.firebaseEnabled = status.enabled;
    state.firebaseReady = status.ready;
    state.firebaseReason = status.reason;
    els.firebaseStatus.textContent = status.reason;
}

function renderAll() {
    renderFirebaseStatus();
    renderWeekSwitch();
    renderPlan();
    renderCalendar();
    renderLibrary();
    renderAlerts();
    updateMetrics();
}

function populateDemoProfile() {
    const demo = {
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
        equipment: ["none", "dumbbells", "band", "bike"],
        focus: ["strength", "hypertrophy", "cardio", "mobility"],
        restrictions: "lombar sensível ocasionalmente",
        preferences: "Quero treinos intensos, com progressão e alertas se eu faltar.",
    };
    applyProfile(demo);
}

async function hydrateFromRemoteIfPossible() {
    try {
        const remote = await loadCoachState(getFirebaseUserId());
        if (remote?.profile) {
            state.profile = { ...getDefaultProfile(), ...remote.profile };
            state.plan = remote.plan || state.plan;
            state.checkins = remote.checkins || state.checkins;
            storage.write(PROFILE_KEY, state.profile);
            storage.write(PLAN_KEY, state.plan);
            storage.write(CHECKIN_KEY, state.checkins);
        }
    } catch {
        // fallback local only
    }
}

function wireEvents() {
    els.coachForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const profile = readFormProfile();
        state.profile = profile;
        saveLocalState();
        state.plan = buildPlan(profile);
        state.selectedWeek = 0;
        saveLocalState();
        await persistState();
        renderAll();
        showToast("Treino gerado com sucesso. Veja o plano abaixo.");
        scrollToPlan();
    });

    els.generateBtn.addEventListener("click", () => {
        els.coachForm.requestSubmit();
    });

    els.demoBtn.addEventListener("click", async () => {
        populateDemoProfile();
        state.plan = buildPlan(state.profile);
        state.selectedWeek = 0;
        await persistState();
        renderAll();
        showToast("Exemplo premium carregado.");
        scrollToPlan();
    });

    els.resetBtn.addEventListener("click", async () => {
        state.profile = getDefaultProfile();
        state.plan = null;
        state.checkins = {};
        state.selectedWeek = 0;
        storage.remove(PROFILE_KEY);
        storage.remove(PLAN_KEY);
        storage.remove(CHECKIN_KEY);
        await persistState();
        writeProfileToForm(state.profile);
        renderAll();
        showToast("Formulário resetado.");
    });
}

async function main() {
    try {
        writeProfileToForm(state.profile);
        wireEvents();
        renderAll();

        const config = storage.read(CUSTOM_CONFIG_KEY, null);
        if (config && typeof config === "object") {
            globalThis.FIREBASE_CONFIG = config;
        }

        void (async () => {
            const firebaseStatus = await initCoachFirebase();
            if (firebaseStatus.enabled && firebaseStatus.ready) {
                await hydrateFromRemoteIfPossible();
            }
            renderAll();
        })();
    } catch (error) {
        console.error("Falha ao inicializar o coach:", error);
        renderAll();
    }
}

main();
