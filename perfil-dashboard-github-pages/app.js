const STORAGE_KEY = "central-norte-profiles-v1";
const COACH_WHATSAPP_KEY = "central-norte-coach-whatsapp-v1";
const REGISTRATIONS_KEY = "central-norte-student-registrations-v1";
const CHECKINS_KEY = "central-norte-student-checkins-v1";
const SESSION_KEY = "central-norte-session-v1";
const REMOTE_TOKEN_KEY = "central-norte-remote-token-v1";
const ADMIN_CODE = "FACU2026";
const REMOTE_SYNC_ENABLED = false;

let remoteSyncReady = false;
let remoteSyncTimer = null;

const seedProfiles = [];

/*
  {
    id: "perfil-ejemplo",
    name: "Alumno ejemplo",
    evaluationDate: "2026-05-25",
    birthDate: "2006-11-07",
    age: 19,
    sport: "Fútbol",
    position: "Extremo",
    category: "Profesional",
    club: "Central Norte",
    dominantLeg: "Derecha",
    coach: "Pintos Facundo",
    phone: "",
    whatsapp: "",
    email: "",
    studentPassword: "",
    photoUrl: "./assets/paolo-dorini.jpeg",
    heightCm: 170,
    weightKg: 69,
    sleepHours: "",
    pain: "",
    stress: "",
    motivation: "",
    objective:
      "Tener un propósito que vaya más allá de solo ser jugador de fútbol: dejar algo en las personas y sostener resultados deportivos desde esa base.",
    injuries: "Ninguna",
    restrictions: "-",
    availability: "Todos los días, por la tarde",
    trainingGoal: "Poder rendir al máximo en la cancha",
    trainingPlanUrl: "",
    coachNote:
      "Para mí es un lugar donde practico constancia y fortalezco mi mentalidad; es un lugar que disfruto.",
    nutritionGoal: "",
    fvMethod: "Saltos con carga",
    encoderCut: 20,
    source: "Perfil Paolo Dorini_deportista_central_norte.xlsx",
    createdAt: "2026-05-25T00:00:00.000Z",
    updatedAt: "2026-05-25T00:00:00.000Z"
  }
*/

const state = {
  profiles: loadProfiles(),
  registrations: loadRegistrations(),
  checkins: loadCheckins(),
  session: loadSession(),
  selectedId: null,
  editingId: null,
  filters: {
    search: "",
    category: "Todos",
    position: "Todos",
    status: "Todos"
  }
};

const els = {
  accessScreen: document.querySelector("#accessScreen"),
  appTopbar: document.querySelector("#appTopbar"),
  appShell: document.querySelector("#appShell"),
  studentAccessForm: document.querySelector("#studentAccessForm"),
  adminAccessForm: document.querySelector("#adminAccessForm"),
  studentAccessNote: document.querySelector("#studentAccessNote"),
  adminAccessNote: document.querySelector("#adminAccessNote"),
  sessionLabel: document.querySelector("#sessionLabel"),
  logoutButton: document.querySelector("#logoutButton"),
  kpiGrid: document.querySelector("#kpiGrid"),
  positionBars: document.querySelector("#positionBars"),
  positionTotal: document.querySelector("#positionTotal"),
  categoryDonut: document.querySelector("#categoryDonut"),
  categoryLegend: document.querySelector("#categoryLegend"),
  categoryTotal: document.querySelector("#categoryTotal"),
  bmiScale: document.querySelector("#bmiScale"),
  profileList: document.querySelector("#profileList"),
  detailPane: document.querySelector("#detailPane"),
  resultCount: document.querySelector("#resultCount"),
  searchInput: document.querySelector("#searchInput"),
  categoryFilter: document.querySelector("#categoryFilter"),
  positionFilter: document.querySelector("#positionFilter"),
  statusFilter: document.querySelector("#statusFilter"),
  resetFiltersButton: document.querySelector("#resetFiltersButton"),
  restoreSeedButton: document.querySelector("#restoreSeedButton"),
  adminRequests: document.querySelector("#adminRequests"),
  newProfileButton: document.querySelector("#newProfileButton"),
  exportCsvButton: document.querySelector("#exportCsvButton"),
  exportJsonButton: document.querySelector("#exportJsonButton"),
  importJsonButton: document.querySelector("#importJsonButton"),
  jsonFileInput: document.querySelector("#jsonFileInput"),
  dialog: document.querySelector("#profileDialog"),
  form: document.querySelector("#profileForm"),
  dialogTitle: document.querySelector("#dialogTitle"),
  closeDialogButton: document.querySelector("#closeDialogButton"),
  cancelFormButton: document.querySelector("#cancelFormButton"),
  bmiPreview: document.querySelector("#bmiPreview")
};

const palette = ["#1f7a55", "#27638f", "#c47a1f", "#8d5aa7", "#b94b3a", "#53665e"];

function loadProfiles() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return applyMigrations(structuredClone(seedProfiles));
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length
      ? applyMigrations(parsed)
      : applyMigrations(structuredClone(seedProfiles));
  } catch {
    return applyMigrations(structuredClone(seedProfiles));
  }
}

function applyMigrations(profiles) {
  return profiles.map((profile) => {
    if (normalize(profile.name) === "paolo dorini") {
      return {
        ...profile,
        photoUrl: profile.photoUrl || "./assets/paolo-dorini.jpeg",
        whatsapp: profile.whatsapp || profile.phone || "",
        email: profile.email || "",
        studentPassword: profile.studentPassword || ""
      };
    }
    return {
      ...profile,
      email: profile.email || "",
      whatsapp: profile.whatsapp || profile.phone || "",
      studentPassword: profile.studentPassword || ""
    };
  });
}

function saveProfiles() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.profiles));
  queueRemoteSave();
}

function loadRegistrations() {
  try {
    const stored = localStorage.getItem(REGISTRATIONS_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return applyRegistrationMigrations(Array.isArray(parsed) ? parsed : []);
  } catch {
    return applyRegistrationMigrations([]);
  }
}

function applyRegistrationMigrations(registrations) {
  return registrations;
}

function saveRegistrations() {
  localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(state.registrations));
  queueRemoteSave();
}

function loadCheckins() {
  try {
    const stored = localStorage.getItem(CHECKINS_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCheckins() {
  localStorage.setItem(CHECKINS_KEY, JSON.stringify(state.checkins));
  queueRemoteSave();
}

function persistStateLocally() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.profiles));
  localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(state.registrations));
  localStorage.setItem(CHECKINS_KEY, JSON.stringify(state.checkins));
}

function buildRemoteSnapshot() {
  return {
    profiles: state.profiles,
    registrations: state.registrations,
    checkins: state.checkins,
    coachWhatsapp: localStorage.getItem(COACH_WHATSAPP_KEY) || ""
  };
}

function applyRemoteState(remoteState) {
  if (Array.isArray(remoteState.profiles)) {
    state.profiles = applyMigrations(remoteState.profiles);
  }
  if (Array.isArray(remoteState.registrations)) {
    state.registrations = applyRegistrationMigrations(remoteState.registrations);
  }
  if (Array.isArray(remoteState.checkins)) {
    state.checkins = remoteState.checkins;
  }
  if (typeof remoteState.coachWhatsapp === "string") {
    localStorage.setItem(COACH_WHATSAPP_KEY, remoteState.coachWhatsapp);
  }
}

function getRemoteToken() {
  return sessionStorage.getItem(REMOTE_TOKEN_KEY) || "";
}

function saveRemoteToken(token) {
  if (token) sessionStorage.setItem(REMOTE_TOKEN_KEY, token);
}

function clearRemoteToken() {
  sessionStorage.removeItem(REMOTE_TOKEN_KEY);
}

function applyRemotePayload(payload) {
  if (payload.state) {
    applyRemoteState(payload.state);
    persistStateLocally();
  }
  if (payload.session) {
    state.session = payload.session;
    saveSession();
    state.selectedId = payload.session.profileId || state.profiles[0]?.id || null;
  }
}

async function remoteRequest(path, options = {}) {
  const token = getRemoteToken();
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };
  const response = await fetch(path, { ...options, headers, cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || payload.error || "No se pudo completar la accion.");
  }
  return { payload, status: response.status };
}

function queueRemoteSave(options = {}) {
  if (!REMOTE_SYNC_ENABLED || !remoteSyncReady || !getRemoteToken()) return;
  window.clearTimeout(remoteSyncTimer);
  remoteSyncTimer = window.setTimeout(pushRemoteState, options.immediate ? 0 : 300);
}

async function pushRemoteState() {
  try {
    const { payload } = await remoteRequest("./api/state", {
      method: "PUT",
      body: JSON.stringify(buildRemoteSnapshot())
    });
    applyRemotePayload(payload);
  } catch (error) {
    console.warn("No se pudo sincronizar el dashboard.", error);
  }
}

async function initializeRemoteSync() {
  if (!REMOTE_SYNC_ENABLED) return;
  const token = getRemoteToken();
  remoteSyncReady = true;
  if (!token) {
    clearSession();
    render();
    return;
  }

  try {
    const { payload } = await remoteRequest("./api/me");
    applyRemotePayload(payload);
    render();
  } catch (error) {
    clearRemoteToken();
    clearSession();
    render();
    console.warn("Sesion remota vencida o no disponible.", error);
  }
}

function loadSession() {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : { role: null };
  } catch {
    return { role: null };
  }
}

function saveSession() {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(state.session));
}

function clearSession() {
  state.session = { role: null };
  sessionStorage.removeItem(SESSION_KEY);
  clearRemoteToken();
}

function calculateBmi(profile) {
  const height = parseNumber(profile.heightCm);
  const weight = parseNumber(profile.weightKg);
  if (!height || !weight) return null;
  return weight / Math.pow(height / 100, 2);
}

function bmiStatus(value) {
  if (!value) return "Pendiente";
  if (value < 18.5) return "Bajo";
  if (value < 25) return "Normal";
  if (value < 30) return "Sobrepeso";
  return "Alto";
}

function profileStatus(profile) {
  const injury = normalize(profile.injuries);
  const restriction = normalize(profile.restrictions);
  const pain = parseNumber(profile.pain);
  const stress = parseNumber(profile.stress);
  if (
    pain >= 6 ||
    stress >= 8 ||
    (injury && !["no", "ninguna", "ninguno", "-"].includes(injury)) ||
    (restriction && !["no", "ninguna", "ninguno", "-"].includes(restriction))
  ) {
    return "Atención";
  }
  if (!profile.evaluationDate || !profile.heightCm || !profile.weightKg) return "Incompleto";
  return "Activo";
}

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizeEmail(value) {
  return normalize(value);
}

function normalizePhone(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function phonesMatch(a, b) {
  const left = normalizePhone(a);
  const right = normalizePhone(b);
  if (!left || !right) return false;
  return left === right || left.endsWith(right.slice(-10)) || right.endsWith(left.slice(-10));
}

function isAdmin() {
  return state.session.role === "admin";
}

function isStudent() {
  return state.session.role === "student";
}

function formatNumber(value, digits = 1) {
  const number = parseNumber(value);
  if (!Number.isFinite(number)) return "-";
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(number);
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function uniqueOptions(key) {
  const values = [...new Set(state.profiles.map((profile) => profile[key]).filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b), "es")
  );
  return ["Todos", ...values];
}

function renderFilters() {
  fillSelect(els.categoryFilter, uniqueOptions("category"), state.filters.category);
  fillSelect(els.positionFilter, uniqueOptions("position"), state.filters.position);
  fillSelect(els.statusFilter, ["Todos", "Activo", "Atención", "Incompleto"], state.filters.status);
}

function fillSelect(select, options, selected) {
  select.innerHTML = options
    .map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`)
    .join("");
  select.value = options.includes(selected) ? selected : "Todos";
}

function getFilteredProfiles() {
  const search = normalize(state.filters.search);
  return state.profiles.filter((profile) => {
    const haystack = normalize(
      [profile.name, profile.club, profile.position, profile.category, profile.coach, profile.objective].join(" ")
    );
    const matchesSearch = !search || haystack.includes(search);
    const matchesCategory = state.filters.category === "Todos" || profile.category === state.filters.category;
    const matchesPosition = state.filters.position === "Todos" || profile.position === state.filters.position;
    const matchesStatus = state.filters.status === "Todos" || profileStatus(profile) === state.filters.status;
    return matchesSearch && matchesCategory && matchesPosition && matchesStatus;
  });
}

function render() {
  renderShellState();
  if (!state.session.role) return;

  if (!state.selectedId || !state.profiles.some((profile) => profile.id === state.selectedId)) {
    state.selectedId = isStudent() ? state.session.profileId : (state.profiles[0]?.id ?? null);
  }
  renderFilters();
  const filtered = getVisibleProfiles();
  renderKpis(filtered);
  renderPositionBars(filtered);
  renderCategoryDonut(filtered);
  renderBmiScale(filtered);
  renderProfileList(filtered);
  renderDetail();
  renderAdminRequests();
}

function renderShellState() {
  const hasSession = Boolean(state.session.role);
  els.accessScreen.classList.toggle("hidden", hasSession);
  els.appTopbar.classList.toggle("hidden", !hasSession);
  els.appShell.classList.toggle("hidden", !hasSession);
  document.body.classList.toggle("admin-mode", isAdmin());
  document.body.classList.toggle("student-mode", isStudent());

  if (!hasSession) {
    els.sessionLabel.textContent = "";
    return;
  }

  els.sessionLabel.textContent = isAdmin()
    ? "Admin: Facundo"
    : `Alumno: ${state.session.email || "perfil"}`;
}

function getVisibleProfiles() {
  if (isStudent()) {
    const profile = state.profiles.find((item) => item.id === state.session.profileId);
    return profile ? [profile] : [];
  }
  return getFilteredProfiles();
}

function getProfileCheckins(profileId) {
  return state.checkins
    .filter((checkin) => checkin.profileId === profileId)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function renderKpis(profiles) {
  const total = profiles.length;
  const bmiValues = profiles.map(calculateBmi).filter(Boolean);
  const avgBmi = bmiValues.length ? bmiValues.reduce((sum, value) => sum + value, 0) / bmiValues.length : null;
  const ages = profiles.map((profile) => parseNumber(profile.age)).filter(Number.isFinite);
  const avgAge = ages.length ? ages.reduce((sum, value) => sum + value, 0) / ages.length : null;
  const attention = profiles.filter((profile) => profileStatus(profile) === "Atención").length;
  const latest = profiles
    .map((profile) => profile.evaluationDate)
    .filter(Boolean)
    .sort()
    .at(-1);

  const cards = [
    ["Perfiles", total, "Base actual filtrada"],
    ["Edad promedio", avgAge ? formatNumber(avgAge, 0) : "-", "Años"],
    ["IMC promedio", avgBmi ? formatNumber(avgBmi, 1) : "-", avgBmi ? bmiStatus(avgBmi) : "Pendiente"],
    ["Alertas", attention, latest ? `Última eval.: ${formatDate(latest)}` : "Sin evaluaciones"]
  ];

  els.kpiGrid.innerHTML = cards
    .map(
      ([label, value, note]) => `
        <article class="kpi-card">
          <p class="kpi-label">${escapeHtml(label)}</p>
          <p class="kpi-value">${escapeHtml(value)}</p>
          <p class="kpi-note">${escapeHtml(note)}</p>
        </article>
      `
    )
    .join("");
}

function renderPositionBars(profiles) {
  const counts = countBy(profiles, "position", "Sin posición");
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...rows.map(([, count]) => count));
  els.positionTotal.textContent = `${profiles.length} perfiles`;
  els.positionBars.innerHTML = rows.length
    ? rows
        .map(
          ([label, count], index) => `
          <div class="bar-row">
            <span class="bar-label">${escapeHtml(label)}</span>
            <span class="bar-track"><span class="bar-fill" style="width:${(count / max) * 100}%; background:${palette[index % palette.length]}"></span></span>
            <span class="bar-count">${count}</span>
          </div>
        `
        )
        .join("")
    : `<div class="empty-state">No hay posiciones para mostrar.</div>`;
}

function renderCategoryDonut(profiles) {
  const counts = countBy(profiles, "category", "Sin categoría");
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  els.categoryTotal.textContent = total ? `${entries.length} categorías` : "Sin datos";

  if (!total) {
    els.categoryDonut.style.background = "#e7ece8";
    els.categoryLegend.innerHTML = `<div class="empty-state">No hay categorías para mostrar.</div>`;
    return;
  }

  let start = 0;
  const segments = entries.map(([, count], index) => {
    const end = start + (count / total) * 100;
    const segment = `${palette[index % palette.length]} ${start}% ${end}%`;
    start = end;
    return segment;
  });

  els.categoryDonut.style.background = `conic-gradient(${segments.join(", ")})`;
  els.categoryLegend.innerHTML = entries
    .map(
      ([label, count], index) => `
      <div class="legend-item">
        <span class="legend-swatch" style="background:${palette[index % palette.length]}"></span>
        <span>${escapeHtml(label)}</span>
        <strong>${count}</strong>
      </div>
    `
    )
    .join("");
}

function renderBmiScale(profiles) {
  const points = profiles
    .map((profile) => ({ profile, bmi: calculateBmi(profile) }))
    .filter((item) => item.bmi)
    .sort((a, b) => a.bmi - b.bmi);

  const markerHtml = points
    .map((item) => {
      const position = Math.max(0, Math.min(100, ((item.bmi - 16) / (34 - 16)) * 100));
      return `<span class="bmi-marker" title="${escapeHtml(item.profile.name)}: ${formatNumber(item.bmi, 1)}" style="left:${position}%"></span>`;
    })
    .join("");

  const pointHtml = points
    .map(
      (item) => `
      <span class="bmi-point">${escapeHtml(item.profile.name)} · ${formatNumber(item.bmi, 1)} · ${escapeHtml(bmiStatus(item.bmi))}</span>
    `
    )
    .join("");

  els.bmiScale.innerHTML = points.length
    ? `
      <div class="bmi-track">${markerHtml}</div>
      <div class="bmi-labels">
        <span>Bajo</span>
        <span>Normal</span>
        <span>Sobrepeso</span>
        <span>Alto</span>
      </div>
      <div class="bmi-points">${pointHtml}</div>
    `
    : `<div class="empty-state">Cargá altura y peso para activar esta lectura.</div>`;
}

function renderProfileList(profiles) {
  els.resultCount.textContent = `${profiles.length} ${profiles.length === 1 ? "resultado" : "resultados"}`;
  els.profileList.innerHTML = profiles.length
    ? profiles
        .map((profile) => {
          const bmi = calculateBmi(profile);
          const status = profileStatus(profile);
          return `
          <button class="profile-card ${profile.id === state.selectedId ? "active" : ""}" type="button" data-select="${escapeHtml(profile.id)}">
            <span class="profile-main">
              ${profileAvatar(profile, "profile-photo")}
              <span>
                <p class="profile-name">${escapeHtml(profile.name || "Sin nombre")}</p>
                <p class="profile-meta">
                  <span>${escapeHtml(profile.position || "Sin posición")}</span>
                  <span>${escapeHtml(profile.club || "Sin club")}</span>
                  <span>${escapeHtml(profile.category || "Sin categoría")}</span>
                </p>
              </span>
            </span>
            <span class="profile-stats">
              <span><strong>${profile.age || "-"}</strong>Edad</span>
              <span><strong>${bmi ? formatNumber(bmi, 1) : "-"}</strong>IMC</span>
              <span><strong>${escapeHtml(status)}</strong>Estado</span>
            </span>
          </button>
        `;
        })
        .join("")
    : `<div class="empty-state">No hay perfiles que coincidan con los filtros.</div>`;
}

function renderDetail() {
  const profile = state.profiles.find((item) => item.id === state.selectedId);
  if (!profile) {
    els.detailPane.innerHTML = `<p class="detail-empty">Seleccioná o cargá un perfil para ver el detalle.</p>`;
    return;
  }

  const bmi = calculateBmi(profile);
  const status = profileStatus(profile);
  els.detailPane.innerHTML = `
    <div class="detail-photo-wrap">
      ${profileAvatar(profile, "detail-photo")}
    </div>
    <div class="detail-head">
      <div>
        <p class="eyebrow">${escapeHtml(status)}</p>
        <h2 class="detail-title">${escapeHtml(profile.name || "Sin nombre")}</h2>
        <p class="detail-subtitle">${escapeHtml(profile.position || "Sin posición")} · ${escapeHtml(profile.club || "Sin club")}</p>
      </div>
      ${
        isAdmin()
          ? `<div class="detail-actions">
              <button class="icon-button" type="button" title="Editar perfil" data-edit="${escapeHtml(profile.id)}">E</button>
              <button class="icon-button" type="button" title="Eliminar perfil" data-delete="${escapeHtml(profile.id)}">B</button>
            </div>`
          : ""
      }
    </div>
    <div class="detail-grid">
      ${fact("Evaluación", formatDate(profile.evaluationDate))}
      ${fact("Edad", profile.age ? `${profile.age} años` : "-")}
      ${fact("Pierna", profile.dominantLeg || "-")}
      ${fact("Profe", profile.coach || "-")}
      ${fact("Altura", profile.heightCm ? `${formatNumber(profile.heightCm, 1)} cm` : "-")}
      ${fact("Peso", profile.weightKg ? `${formatNumber(profile.weightKg, 1)} kg` : "-")}
      ${fact("IMC", bmi ? `${formatNumber(bmi, 1)} (${bmiStatus(bmi)})` : "-")}
      ${fact("Sueño", profile.sleepHours ? `${formatNumber(profile.sleepHours, 1)} h` : "-")}
    </div>
    ${isAdmin() ? renderStudentCredentialsCard(profile) : ""}
    ${renderTrainingPlanCard(profile)}
    ${
      isAdmin()
        ? `
          ${noteBlock("Objetivo principal", profile.objective)}
          ${noteBlock("Lesiones / restricciones", [profile.injuries, profile.restrictions].filter(Boolean).join(" | "))}
          ${noteBlock("Disponibilidad", profile.availability)}
          ${noteBlock("Observación del profe", profile.coachNote)}
        `
        : ""
    }
    ${renderStudentCheckinCard(profile)}
    ${renderFeedbackCard(profile)}
  `;
}

function renderStudentCheckinCard(profile) {
  const checkins = getProfileCheckins(profile.id);
  const latest = checkins.slice(0, isAdmin() ? 6 : 3);
  const history = latest.length
    ? latest
        .map(
          (checkin) => `
          <article class="checkin-item">
            <div class="checkin-head">
              <strong>${escapeHtml(formatDateTime(checkin.createdAt))}</strong>
              <span>${escapeHtml(checkin.feeling || "Sin estado")}</span>
            </div>
            <p><b>Sueño:</b> ${escapeHtml(checkin.sleepQuality || "-")}</p>
            <p><b>Entrenó:</b> ${escapeHtml(checkin.clubTraining || "-")}</p>
            ${checkin.note ? `<p><b>Nota:</b> ${escapeHtml(checkin.note)}</p>` : ""}
            ${renderMealPhotos(checkin.mealPhotos)}
          </article>
        `
        )
        .join("")
    : `<p class="feedback-hint">Todavia no hay cargas del alumno.</p>`;

  if (isAdmin()) {
    return `
      <section class="student-data-card">
        <div>
          <p class="eyebrow">Seguimiento del alumno</p>
          <h3>Cargas recientes</h3>
        </div>
        <div class="checkin-list">${history}</div>
      </section>
    `;
  }

  return `
    <section class="student-data-card">
      <div>
        <p class="eyebrow">Carga diaria</p>
        <h3>Datos para el profe</h3>
      </div>
      <form class="student-checkin-form" data-checkin-form>
        <label>
          Calidad de sueño
          <select name="sleepQuality" required>
            <option value="">Seleccionar</option>
            <option>Muy buena</option>
            <option>Buena</option>
            <option>Regular</option>
            <option>Mala</option>
            <option>Muy mala</option>
          </select>
        </label>
        <label>
          Cómo me siento
          <select name="feeling" required>
            <option value="">Seleccionar</option>
            <option>Muy bien</option>
            <option>Bien</option>
            <option>Cansado</option>
            <option>Con molestias</option>
            <option>Necesito hablar con el profe</option>
          </select>
        </label>
        <label>
          Qué entrené en el club
          <textarea name="clubTraining" rows="3" placeholder="Ej: gimnasio, técnica, táctico, reducido, velocidad..." required></textarea>
        </label>
        <label>
          Foto de las comidas
          <input name="mealPhotos" type="file" accept="image/*" multiple />
        </label>
        <label>
          Nota extra
          <textarea name="note" rows="2" placeholder="Algo que quieras que vea el profe..."></textarea>
        </label>
        <button class="button primary" type="submit">Guardar carga</button>
        <p class="feedback-hint">La carga queda guardada dentro de esta página para que el admin la vea.</p>
      </form>
      <div class="checkin-list">${history}</div>
    </section>
  `;
}

function renderTrainingPlanCard(profile) {
  const planUrl = normalizeUrl(profile.trainingPlanUrl);

  if (isAdmin()) {
    return `
      <form class="training-plan-card" data-training-link-form>
        <div>
          <p class="eyebrow">Plan de entrenamiento</p>
          <h3>Link para el alumno</h3>
        </div>
        <label>
          Link del plan
          <input name="trainingPlanUrl" type="url" placeholder="https://..." value="${escapeHtml(profile.trainingPlanUrl || "")}" />
        </label>
        <button class="button primary" type="submit">Guardar link del plan</button>
        ${
          planUrl
            ? `<a class="plan-link" href="${escapeHtml(planUrl)}" target="_blank" rel="noopener">Abrir plan actual</a>`
            : `<p class="feedback-hint">Todavía no hay link cargado para este perfil.</p>`
        }
      </form>
    `;
  }

  return `
    <section class="training-plan-card">
      <div>
        <p class="eyebrow">Plan de entrenamiento</p>
        <h3>Tu plan del profe</h3>
      </div>
      ${
        planUrl
          ? `<a class="button primary plan-button" href="${escapeHtml(planUrl)}" target="_blank" rel="noopener">Abrir mi plan</a>`
          : `<p class="feedback-hint">El profe todavía no cargó el link de tu plan.</p>`
      }
    </section>
  `;
}

function renderStudentCredentialsCard(profile) {
  const registration = getRegistrationForProfile(profile);
  const password = profile.studentPassword || registration?.password || "";
  return `
    <section class="credentials-card">
      <div>
        <p class="eyebrow">Acceso alumno</p>
        <h3>Credenciales</h3>
      </div>
      <div class="credentials-grid">
        ${fact("Gmail", profile.email || registration?.email || "Sin cargar")}
        ${fact("WhatsApp", profile.whatsapp || registration?.whatsapp || "Sin cargar")}
        ${fact("Contraseña", password || "Sin generar")}
      </div>
      <button class="button ghost" type="button" data-regenerate-password="${escapeHtml(profile.id)}">Generar nueva contraseña</button>
      <p class="feedback-hint">Estas credenciales solo se ven como administrador.</p>
    </section>
  `;
}

function renderFeedbackCard(profile) {
  const coachWhatsapp = localStorage.getItem(COACH_WHATSAPP_KEY) || "";
  if (isAdmin()) {
    return `
      <form class="feedback-card" data-coach-whatsapp-form>
        <div>
          <p class="eyebrow">Canal alumno-profe</p>
          <h3>WhatsApp para feedback</h3>
        </div>
        <label>
          Tu WhatsApp como profe
          <input name="coachWhatsapp" inputmode="tel" placeholder="Ej: 5493870000000" value="${escapeHtml(coachWhatsapp)}" />
        </label>
        <button class="button whatsapp" type="submit">Guardar WhatsApp del profe</button>
        <p class="feedback-hint">Los alumnos usan este numero para mandarte feedback desde su perfil.</p>
      </form>
    `;
  }

  return `
    <form class="feedback-card" data-feedback-form>
      <div>
        <p class="eyebrow">WhatsApp</p>
        <h3>Feedback al profe</h3>
      </div>
      <label>
        Estado rapido
        <select name="mood">
          <option>Me siento bien</option>
          <option>Estoy cansado</option>
          <option>Tengo una molestia</option>
          <option>No pude entrenar</option>
          <option>Necesito hablar con el profe</option>
        </select>
      </label>
      <label>
        Mensaje
        <textarea name="message" rows="3" placeholder="Escribi el feedback que queres mandarle al profe..."></textarea>
      </label>
      <button class="button whatsapp" type="submit" ${coachWhatsapp ? "" : "disabled"}>Enviar por WhatsApp</button>
      <p class="feedback-hint">${
        coachWhatsapp
          ? "Se abre WhatsApp con el mensaje armado. Revisalo antes de enviarlo."
          : "El profe todavia no configuro el WhatsApp de recepcion."
      }</p>
    </form>
  `;
}

function profileAvatar(profile, className) {
  if (profile.photoUrl) {
    return `<img class="${className}" src="${escapeHtml(profile.photoUrl)}" alt="Foto de ${escapeHtml(profile.name || "deportista")}" />`;
  }
  const initials = String(profile.name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return `<span class="${className} avatar-fallback">${escapeHtml(initials || "?")}</span>`;
}

function fact(label, value) {
  return `<div class="fact"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function noteBlock(title, body) {
  if (!body) return "";
  return `
    <div class="note-block">
      <h4>${escapeHtml(title)}</h4>
      <p>${escapeHtml(body)}</p>
    </div>
  `;
}

function renderMealPhotos(photos = []) {
  if (!photos.length) return "";
  return `
    <div class="meal-photo-grid">
      ${photos
        .map((photo, index) => `<img src="${escapeHtml(photo)}" alt="Comida cargada ${index + 1}" />`)
        .join("")}
    </div>
  `;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function countBy(profiles, key, fallback) {
  return profiles.reduce((acc, profile) => {
    const label = profile[key] || fallback;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
}

function renderAdminRequests() {
  if (!els.adminRequests || !isAdmin()) return;

  const rows = state.registrations
    .slice()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 8);

  els.adminRequests.innerHTML = `
    <div class="requests-head">
      <p class="eyebrow">Alumnos</p>
      <h3>Registros</h3>
    </div>
    ${
      rows.length
        ? rows
            .map((registration) => {
              const linkedProfile = state.profiles.find((profile) => profile.id === registration.linkedProfileId);
              return `
                <div class="request-row">
                  <span>
                    <strong>${escapeHtml(registration.email || "Sin Gmail")}</strong>
                    <small>${escapeHtml(registration.whatsapp || "Sin WhatsApp")}</small>
                    <small>${linkedProfile ? `Vinculado: ${escapeHtml(linkedProfile.name)}` : "Pendiente"}</small>
                  </span>
                  ${
                    linkedProfile
                      ? ""
                      : `<button class="link-button" type="button" data-link-registration="${escapeHtml(registration.id)}">Vincular al perfil seleccionado</button>`
                  }
                </div>
              `;
            })
            .join("")
        : `<p class="feedback-hint">Todavia no hay registros de alumnos.</p>`
    }
  `;
}

function openDialog(profile = null) {
  state.editingId = profile?.id ?? null;
  els.dialogTitle.textContent = profile ? "Editar perfil" : "Nuevo perfil";
  els.form.reset();

  const values = profile ?? {
    evaluationDate: new Date().toISOString().slice(0, 10),
    sport: "Fútbol",
    club: "Central Norte",
    category: "Profesional"
  };

  [...els.form.elements].forEach((element) => {
    if (!element.name || values[element.name] === undefined) return;
    element.value = values[element.name] ?? "";
  });
  updateBmiPreview();
  els.dialog.showModal();
}

function closeDialog() {
  els.dialog.close();
  state.editingId = null;
}

function handleSubmit(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(els.form).entries());
  const existing = state.profiles.find((profile) => profile.id === state.editingId);
  const now = new Date().toISOString();
  const isNewProfile = !existing;
  const studentPassword = existing?.studentPassword || generateStudentPassword(data.name);
  const normalized = {
    ...(existing ?? {}),
    ...data,
    id: existing?.id ?? makeId(data.name),
    email: normalizeEmail(data.email),
    whatsapp: normalizePhone(data.whatsapp),
    studentPassword,
    age: toNumberOrEmpty(data.age),
    heightCm: toNumberOrEmpty(data.heightCm),
    weightKg: toNumberOrEmpty(data.weightKg),
    sleepHours: toNumberOrEmpty(data.sleepHours),
    pain: toNumberOrEmpty(data.pain),
    stress: toNumberOrEmpty(data.stress),
    motivation: toNumberOrEmpty(data.motivation),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };

  if (existing) {
    state.profiles = state.profiles.map((profile) => (profile.id === existing.id ? normalized : profile));
  } else {
    state.profiles = [normalized, ...state.profiles];
  }

  state.selectedId = normalized.id;
  saveProfiles();
  if (isAdmin() && (normalized.email || normalized.whatsapp)) {
    upsertRegistration(normalized.email, normalized.whatsapp, normalized.studentPassword, normalized.id);
  }
  closeDialog();
  render();
  if (isAdmin() && isNewProfile) {
    window.alert(
      `Perfil creado.\n\nAlumno: ${normalized.name || "Sin nombre"}\nGmail: ${normalized.email || "Sin Gmail cargado"}\nContraseña: ${normalized.studentPassword}`
    );
  }
}

function toNumberOrEmpty(value) {
  if (value === "" || value === null || value === undefined) return "";
  const number = parseNumber(value);
  return Number.isFinite(number) ? number : "";
}

function parseNumber(value) {
  if (typeof value === "number") return value;
  if (value === "" || value === null || value === undefined) return NaN;
  return Number(String(value).trim().replace(",", "."));
}

function normalizeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function generateStudentPassword(name = "Alumno") {
  const clean = String(name || "Alumno")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 8) || "Alumno";
  const number = Math.floor(1000 + Math.random() * 9000);
  return `${clean}CN${number}`;
}

function makeId(name) {
  const base = normalize(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = Date.now().toString(36);
  return `${base || "perfil"}-${suffix}`;
}

function updateBmiPreview() {
  const data = Object.fromEntries(new FormData(els.form).entries());
  const bmi = calculateBmi(data);
  els.bmiPreview.textContent = bmi
    ? `IMC calculado: ${formatNumber(bmi, 1)} (${bmiStatus(bmi)})`
    : "IMC pendiente: completá altura y peso";
}

function exportJson() {
  downloadFile("perfiles-deportivos.json", JSON.stringify(state.profiles, null, 2), "application/json");
}

function exportCsv() {
  const columns = [
    "name",
    "email",
    "whatsapp",
    "evaluationDate",
    "age",
    "sport",
    "position",
    "category",
    "club",
    "dominantLeg",
    "coach",
    "heightCm",
    "weightKg",
    "bmi",
    "status",
    "objective",
    "injuries",
    "restrictions",
    "availability",
    "coachNote",
    "trainingPlanUrl",
    "studentPassword"
  ];
  const rows = state.profiles.map((profile) => ({
    ...profile,
    bmi: calculateBmi(profile) ? formatNumber(calculateBmi(profile), 1) : "",
    status: profileStatus(profile)
  }));
  const csv = [columns.join(","), ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(","))].join("\n");
  downloadFile("perfiles-deportivos.csv", csv, "text/csv;charset=utf-8");
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function importJson(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error("El archivo debe contener una lista de perfiles.");
  state.profiles = applyMigrations(parsed.map((profile) => ({
    ...profile,
    id: profile.id || makeId(profile.name),
    updatedAt: profile.updatedAt || new Date().toISOString()
  })));
  state.selectedId = state.profiles[0]?.id ?? null;
  saveProfiles();
  render();
}

function restoreSeed() {
  const confirmed = window.confirm("¿Restaurar el perfil inicial y borrar los perfiles guardados en este navegador?");
  if (!confirmed) return;
  state.profiles = structuredClone(seedProfiles);
  state.selectedId = state.profiles[0]?.id ?? null;
  saveProfiles();
  render();
}

function deleteProfile(id) {
  const profile = state.profiles.find((item) => item.id === id);
  if (!profile) return;
  const confirmed = window.confirm(`¿Eliminar el perfil de ${profile.name}?`);
  if (!confirmed) return;
  state.profiles = state.profiles.filter((item) => item.id !== id);
  state.selectedId = state.profiles[0]?.id ?? null;
  saveProfiles();
  render();
}

function buildWhatsappMessage(profile, mood, message) {
  const bmi = calculateBmi(profile);
  return [
    `Hola profe, soy ${profile.name || "el alumno"}.`,
    `Te mando mi feedback: ${mood}.`,
    message ? `Comentario: ${message}` : "",
    `Perfil: ${profile.position || "sin posicion"} | ${profile.club || "sin club"}.`,
    bmi ? `IMC registrado: ${formatNumber(bmi, 1)} (${bmiStatus(bmi)}).` : "",
    profile.evaluationDate ? `Ultima evaluacion: ${formatDate(profile.evaluationDate)}.` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function sendWhatsappFeedback(form) {
  const profile = state.profiles.find((item) => item.id === state.selectedId);
  if (!profile) return;

  const data = Object.fromEntries(new FormData(form).entries());
  const phone = String(data.coachWhatsapp || "").replace(/\D/g, "");
  if (!phone) {
    window.alert("Agrega tu numero de WhatsApp como profe para poder recibir el feedback.");
    form.elements.coachWhatsapp.focus();
    return;
  }

  localStorage.setItem(COACH_WHATSAPP_KEY, phone);
  queueRemoteSave();
  const text = buildWhatsappMessage(profile, data.mood, String(data.message || "").trim());
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener");
}

function saveCoachWhatsapp(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const phone = normalizePhone(data.coachWhatsapp);
  if (!phone) {
    window.alert("Agrega un WhatsApp valido para recibir feedback.");
    form.elements.coachWhatsapp.focus();
    return;
  }
  localStorage.setItem(COACH_WHATSAPP_KEY, phone);
  queueRemoteSave();
  window.alert("WhatsApp del profe guardado.");
  render();
}

function saveTrainingPlanLink(form) {
  if (!isAdmin()) return;
  const profile = state.profiles.find((item) => item.id === state.selectedId);
  if (!profile) return;

  const data = Object.fromEntries(new FormData(form).entries());
  profile.trainingPlanUrl = String(data.trainingPlanUrl || "").trim();
  profile.updatedAt = new Date().toISOString();
  saveProfiles();
  render();
}

function findProfileForStudent(email, whatsapp) {
  const cleanEmail = normalizeEmail(email);
  const cleanPhone = normalizePhone(whatsapp);
  const registration = state.registrations.find(
    (item) =>
      (cleanEmail && normalizeEmail(item.email) === cleanEmail) ||
      (cleanPhone && phonesMatch(item.whatsapp, cleanPhone))
  );
  if (registration?.linkedProfileId) {
    const linked = state.profiles.find((profile) => profile.id === registration.linkedProfileId);
    if (linked) return linked;
  }
  return state.profiles.find((profile) => {
    const profileEmail = normalizeEmail(profile.email);
    const profilePhone = profile.whatsapp || profile.phone;
    return (cleanEmail && profileEmail && profileEmail === cleanEmail) || (cleanPhone && phonesMatch(profilePhone, cleanPhone));
  });
}

function upsertRegistration(email, whatsapp, password, linkedProfileId = "") {
  const cleanEmail = normalizeEmail(email);
  const cleanPhone = normalizePhone(whatsapp);
  const existing = state.registrations.find(
    (registration) =>
      (linkedProfileId && registration.linkedProfileId === linkedProfileId) ||
      (cleanEmail && normalizeEmail(registration.email) === cleanEmail) ||
      (cleanPhone && phonesMatch(registration.whatsapp, cleanPhone))
  );
  const payload = {
    id: existing?.id || makeId(cleanEmail || cleanPhone || "registro"),
    email: cleanEmail,
    whatsapp: cleanPhone,
    password: password || existing?.password || "",
    linkedProfileId: linkedProfileId || existing?.linkedProfileId || "",
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (existing) {
    state.registrations = state.registrations.map((registration) =>
      registration.id === existing.id ? payload : registration
    );
  } else {
    state.registrations = [payload, ...state.registrations];
  }
  saveRegistrations();
  return payload;
}

function getRegistrationForProfile(profile) {
  return state.registrations.find(
    (registration) =>
      registration.linkedProfileId === profile.id ||
      (profile.email && normalizeEmail(registration.email) === normalizeEmail(profile.email)) ||
      phonesMatch(registration.whatsapp, profile.whatsapp || profile.phone)
  );
}

function regenerateStudentPassword(profileId) {
  if (!isAdmin()) return;
  const profile = state.profiles.find((item) => item.id === profileId);
  if (!profile) return;

  profile.studentPassword = generateStudentPassword(profile.name);
  profile.updatedAt = new Date().toISOString();
  saveProfiles();

  if (profile.email || profile.whatsapp) {
    upsertRegistration(profile.email, profile.whatsapp, profile.studentPassword, profile.id);
  }

  window.alert(`Nueva contrase\u00f1a para ${profile.name || "el alumno"}:\n\n${profile.studentPassword}`);
  render();
}

async function remoteStudentAccess(data) {
  try {
    const { payload, status } = await remoteRequest("./api/student/login", {
      method: "POST",
      body: JSON.stringify({
        email: data.email,
        whatsapp: data.whatsapp,
        password: data.password
      })
    });

    if (status === 202 || payload.pending) {
      els.studentAccessNote.textContent =
        payload.message ||
        "Tu registro quedo guardado, pero todavia no hay un perfil vinculado. Avisale al profe para que lo apruebe.";
      return;
    }

    saveRemoteToken(payload.token);
    applyRemotePayload(payload);
    els.studentAccessNote.textContent = "";
    render();
  } catch (error) {
    els.studentAccessNote.textContent = error.message;
  }
}

async function remoteAdminAccess(data) {
  try {
    const { payload } = await remoteRequest("./api/admin/login", {
      method: "POST",
      body: JSON.stringify({ adminCode: data.adminCode })
    });
    saveRemoteToken(payload.token);
    applyRemotePayload(payload);
    els.adminAccessNote.textContent = "";
    render();
  } catch (error) {
    els.adminAccessNote.textContent = error.message;
  }
}

async function handleStudentAccess(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(els.studentAccessForm).entries());
  if (REMOTE_SYNC_ENABLED) {
    await remoteStudentAccess(data);
    return;
  }

  const email = normalizeEmail(data.email);
  const whatsapp = normalizePhone(data.whatsapp);
  const password = String(data.password || "");
  const existingRegistration = state.registrations.find(
    (registration) =>
      (email && normalizeEmail(registration.email) === email) ||
      (whatsapp && phonesMatch(registration.whatsapp, whatsapp))
  );

  if (!password) {
    els.studentAccessNote.textContent = "Agrega una contraseña para ingresar.";
    return;
  }

  const profile = findProfileForStudent(email, whatsapp);
  const expectedPassword = existingRegistration?.password || profile?.studentPassword || "";

  if (expectedPassword && expectedPassword !== password) {
    els.studentAccessNote.textContent = "La contraseña no coincide con este Gmail o WhatsApp.";
    return;
  }

  upsertRegistration(email, whatsapp, expectedPassword || password, profile?.id || "");

  if (!profile) {
    els.studentAccessNote.textContent =
      "Tu registro quedo guardado, pero todavia no hay un perfil vinculado a ese Gmail o WhatsApp. Avisale al profe para que lo apruebe.";
    return;
  }

  if (!profile.email || !profile.whatsapp) {
    Object.assign(profile, {
      email: profile.email || email,
      whatsapp: profile.whatsapp || whatsapp,
      updatedAt: new Date().toISOString()
    });
    saveProfiles();
  }

  state.session = { role: "student", profileId: profile.id, email, whatsapp };
  state.selectedId = profile.id;
  saveSession();
  els.studentAccessNote.textContent = "";
  render();
}

async function handleAdminAccess(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(els.adminAccessForm).entries());
  if (REMOTE_SYNC_ENABLED) {
    await remoteAdminAccess(data);
    return;
  }

  if (String(data.adminCode || "").trim() !== ADMIN_CODE) {
    els.adminAccessNote.textContent = "Clave incorrecta.";
    return;
  }

  state.session = { role: "admin" };
  saveSession();
  els.adminAccessNote.textContent = "";
  render();
}

function logout() {
  clearSession();
  state.selectedId = null;
  render();
}

function linkRegistrationToSelected(registrationId) {
  if (!isAdmin() || !state.selectedId) return;
  const registration = state.registrations.find((item) => item.id === registrationId);
  const profile = state.profiles.find((item) => item.id === state.selectedId);
  if (!registration || !profile) return;

  Object.assign(profile, {
    email: registration.email || profile.email || "",
    whatsapp: registration.whatsapp || profile.whatsapp || "",
    updatedAt: new Date().toISOString()
  });
  registration.linkedProfileId = profile.id;
  registration.updatedAt = new Date().toISOString();
  saveProfiles();
  saveRegistrations();
  render();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function saveStudentCheckin(form) {
  if (!isStudent()) return;
  const profile = state.profiles.find((item) => item.id === state.session.profileId);
  if (!profile) return;

  const data = Object.fromEntries(new FormData(form).entries());
  const fileInput = form.elements.mealPhotos;
  const files = Array.from(fileInput?.files || []).slice(0, 4);
  const mealPhotos = await Promise.all(files.map(readFileAsDataUrl));

  state.checkins = [
    {
      id: makeId(`carga-${profile.name}`),
      profileId: profile.id,
      studentEmail: state.session.email || profile.email || "",
      sleepQuality: data.sleepQuality,
      feeling: data.feeling,
      clubTraining: String(data.clubTraining || "").trim(),
      note: String(data.note || "").trim(),
      mealPhotos,
      createdAt: new Date().toISOString()
    },
    ...state.checkins
  ];
  saveCheckins();
  form.reset();
  render();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

els.studentAccessForm.addEventListener("submit", handleStudentAccess);
els.adminAccessForm.addEventListener("submit", handleAdminAccess);
els.logoutButton.addEventListener("click", logout);

els.searchInput.addEventListener("input", (event) => {
  state.filters.search = event.target.value;
  render();
});

els.categoryFilter.addEventListener("change", (event) => {
  state.filters.category = event.target.value;
  render();
});

els.positionFilter.addEventListener("change", (event) => {
  state.filters.position = event.target.value;
  render();
});

els.statusFilter.addEventListener("change", (event) => {
  state.filters.status = event.target.value;
  render();
});

els.resetFiltersButton.addEventListener("click", () => {
  state.filters = { search: "", category: "Todos", position: "Todos", status: "Todos" };
  els.searchInput.value = "";
  render();
});

els.restoreSeedButton.addEventListener("click", () => {
  if (isAdmin()) restoreSeed();
});
els.newProfileButton.addEventListener("click", () => {
  if (isAdmin()) openDialog();
});
els.exportJsonButton.addEventListener("click", () => {
  if (isAdmin()) exportJson();
});
els.exportCsvButton.addEventListener("click", () => {
  if (isAdmin()) exportCsv();
});
els.importJsonButton.addEventListener("click", () => {
  if (isAdmin()) els.jsonFileInput.click();
});
els.closeDialogButton.addEventListener("click", closeDialog);
els.cancelFormButton.addEventListener("click", closeDialog);
els.form.addEventListener("submit", handleSubmit);
els.form.addEventListener("input", updateBmiPreview);

els.jsonFileInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    await importJson(file);
  } catch (error) {
    window.alert(error.message || "No se pudo importar el archivo.");
  } finally {
    event.target.value = "";
  }
});

els.profileList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-select]");
  if (!button) return;
  state.selectedId = button.dataset.select;
  render();
});

els.adminRequests.addEventListener("click", (event) => {
  const button = event.target.closest("[data-link-registration]");
  if (!button) return;
  linkRegistrationToSelected(button.dataset.linkRegistration);
});

els.detailPane.addEventListener("click", (event) => {
  if (!isAdmin()) return;
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  const regenerateButton = event.target.closest("[data-regenerate-password]");
  if (editButton) {
    const profile = state.profiles.find((item) => item.id === editButton.dataset.edit);
    openDialog(profile);
  }
  if (deleteButton) {
    deleteProfile(deleteButton.dataset.delete);
  }
  if (regenerateButton) {
    regenerateStudentPassword(regenerateButton.dataset.regeneratePassword);
  }
});

els.detailPane.addEventListener("submit", (event) => {
  const feedbackForm = event.target.closest("[data-feedback-form]");
  const coachWhatsappForm = event.target.closest("[data-coach-whatsapp-form]");
  const checkinForm = event.target.closest("[data-checkin-form]");
  const trainingLinkForm = event.target.closest("[data-training-link-form]");
  if (!feedbackForm && !coachWhatsappForm && !checkinForm && !trainingLinkForm) return;
  event.preventDefault();
  if (feedbackForm) sendWhatsappFeedback(feedbackForm);
  if (coachWhatsappForm) saveCoachWhatsapp(coachWhatsappForm);
  if (checkinForm) saveStudentCheckin(checkinForm);
  if (trainingLinkForm) saveTrainingPlanLink(trainingLinkForm);
});

render();
initializeRemoteSync();
