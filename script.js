const STORAGE_KEY = "resume-builder-data";

const $ = (id) => document.getElementById(id);

let resumeData = null;
let saveTimer = null;

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value = "") {
  return escapeHtml(value).replaceAll("\n", "&#10;");
}

function showToast(msg, ms = 3000) {
  const toast = $("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), ms);
}

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

function splitLines(value) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeVolunteering(items) {
  if (!Array.isArray(items)) return [];

  return items.map((item) => {
    if (
      typeof item === "object" &&
      item?.description?.startsWith("ГО «Друзі спільноти святого Егідія»:")
    ) {
      return {
        ...item,
        organization: "ГО «Друзі спільноти святого Егідія»",
        description: item.description.replace(
          "ГО «Друзі спільноти святого Егідія»: ",
          "",
        ),
      };
    }
    if (
      typeof item === "string" &&
      item.toLowerCase().includes("підтримка впо")
    ) {
      return {
        period: "2023 – до теперішнього часу",
        organization: "ГО «Друзі спільноти святого Егідія»",
        description: item
          .replace(/\s*–\s*2023\s*–\s*до теперішнього часу:\s*/, ": ")
          .replace("ГО «Друзі спільноти святого Егідія»: ", ""),
      };
    }
    if (
      typeof item === "string" &&
      item.startsWith("Підтримка ЗСУ та медичної сфери")
    ) {
      return { period: "2024–2025", description: item };
    }
    return item;
  });
}

function normalizeData(data) {
  return {
    name: data?.name || "",
    targetPosition: data?.targetPosition || "",
    photo: data?.photo || "",
    about: data?.about || "",
    contacts: {
      email: data?.contacts?.email || "",
      phone: data?.contacts?.phone || "",
      location: data?.contacts?.location || "",
    },
    skills: Array.isArray(data?.skills) ? data.skills : [],
    education: Array.isArray(data?.education) ? data.education : [],
    volunteering: normalizeVolunteering(data?.volunteering),
    languages: Array.isArray(data?.languages) ? data.languages : [],
    experience: Array.isArray(data?.experience) ? data.experience : [],
  };
}

function saveLocalData() {
  if (!resumeData) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(resumeData));
}

function scheduleAutoSave() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    saveLocalData();
    showToast("Зміни збережено в браузері", 1600);
  }, 500);
}

function renderResume(data) {
  const d = normalizeData(data);
  resumeData = d;

  $("resumeName").textContent = d.name;
  $("targetPosition").textContent = d.targetPosition;
  $("targetPosition").hidden = !d.targetPosition;
  $("aboutText").textContent = d.about;
  renderPhoto(d);
  renderContacts(d.contacts);
  renderSimpleList("skillsList", d.skills);
  renderEducation(d.education);
  renderVolunteering(d.volunteering);
  renderLanguages(d.languages);
  renderExperience(d.experience);
}

function renderPhoto(data) {
  const photoWrap = $("photoWrap");
  photoWrap.innerHTML = '<div class="photo-placeholder">👤</div>';

  if (!data.photo) return;

  const img = document.createElement("img");
  img.alt = data.name;
  img.src = data.photo;
  img.onload = () => {
    photoWrap.innerHTML = "";
    photoWrap.appendChild(img);
  };
}

function renderContacts(contacts) {
  const icons = {
    email: `<svg viewBox="0 0 24 24"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>`,
    phone: `<svg viewBox="0 0 24 24"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.4 21 3 13.6 3 4.5c0-.6.4-1 1-1H7.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>`,
    location: `<svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>`,
  };

  const items = [];
  if (contacts.email) {
    items.push(
      `<li>${icons.email}<a href="mailto:${escapeAttribute(contacts.email)}">${escapeHtml(contacts.email)}</a></li>`,
    );
  }
  if (contacts.phone) {
    items.push(
      `<li>${icons.phone}<span>${escapeHtml(contacts.phone)}</span></li>`,
    );
  }
  if (contacts.location) {
    items.push(
      `<li>${icons.location}<span>${escapeHtml(contacts.location)}</span></li>`,
    );
  }

  $("contactsList").innerHTML = items.join("");
}

function renderSimpleList(id, items) {
  $(id).innerHTML = items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
}

function renderVolunteering(items) {
  $("volList").innerHTML = items
    .map((item) => {
      if (typeof item === "string") return `<li>${escapeHtml(item)}</li>`;

      const period = item?.period
        ? `<p class="exp-period">${escapeHtml(item.period)}</p>`
        : "";
      const organization = item?.organization
        ? `<span class="vol-org">${escapeHtml(item.organization)}</span> `
        : "";
      return `<li>${period}${organization}<span>${escapeHtml(item?.description || "")}</span></li>`;
    })
    .join("");
}

function renderEducation(items) {
  $("eduList").innerHTML = items
    .map(
      (item) => `
        <div class="edu-item">
          <div class="edu-degree">${escapeHtml(item.degree)}</div>
          <div class="edu-inst">${escapeHtml(item.institution)}</div>
        </div>`,
    )
    .join("");
}

function renderLanguages(items) {
  $("langList").innerHTML = items
    .map(
      (item) =>
        `<li><span class="lang-name">${escapeHtml(item.language)}</span><span class="lang-level">${escapeHtml(item.level)}</span></li>`,
    )
    .join("");
}

function renderExperience(items) {
  $("expList").innerHTML = items
    .map(
      (item) => `
        <div class="exp-item">
          <div class="exp-period">${escapeHtml(item.period)}</div>
          ${item.company ? `<div class="exp-company">${escapeHtml(item.company)}</div>` : ""}
          <div class="exp-position">${escapeHtml(item.position)}</div>
          <ul class="exp-duties">
            ${(item.duties || []).map((duty) => `<li>${escapeHtml(duty)}</li>`).join("")}
          </ul>
        </div>`,
    )
    .join("");
}

async function loadData() {
  try {
    const res = await fetch("resume-data.json");
    if (!res.ok) throw new Error("fetch failed");
    const data = normalizeData(await res.json());
    renderResume(data);
    fillEditor(data);
    saveLocalData();
    showToast("Дані оновлено з resume-data.json");
  } catch {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        const data = normalizeData(JSON.parse(await file.text()));
        renderResume(data);
        fillEditor(data);
        saveLocalData();
        showToast("Дані завантажено з файлу");
      } catch {
        showToast("Помилка читання JSON-файлу");
      }
    };
    input.click();
    showToast("Оберіть файл resume-data.json");
  }
}

function savePDF() {
  $("toolbar").style.display = "none";
  const prev = document.title;
  document.title = "Резюме_Кокоуліна_Людмила";
  window.print();
  document.title = prev;
  $("toolbar").style.display = "";
  showToast("Діалог друку / PDF відкрито");
}

function openEditor() {
  fillEditor(resumeData || FALLBACK_DATA);
  $("editorOverlay").classList.add("open");
  $("editorOverlay").setAttribute("aria-hidden", "false");
}

function closeEditor() {
  $("editorOverlay").classList.remove("open");
  $("editorOverlay").setAttribute("aria-hidden", "true");
}

function fillEditor(data) {
  const d = normalizeData(data);
  $("editName").value = d.name;
  $("editTargetPosition").value = d.targetPosition;
  $("editPhoto").value = d.photo;
  $("editAbout").value = d.about;
  $("editEmail").value = d.contacts.email;
  $("editPhone").value = d.contacts.phone;
  $("editLocation").value = d.contacts.location;
  $("editSkills").value = d.skills.join("\n");
  $("editEducation").value = d.education
    .map((item) => `${item.degree || ""} | ${item.institution || ""}`)
    .join("\n");
  $("editVolunteering").value = d.volunteering
    .map((item) =>
      typeof item === "string"
        ? item
        : `${item.period || ""} | ${item.organization || ""} | ${item.description || ""}`,
    )
    .join("\n");
  $("editLanguages").value = d.languages
    .map((item) => `${item.language || ""} | ${item.level || ""}`)
    .join("\n");

  renderExperienceEditor(d.experience);
}

function readEditorData() {
  return normalizeData({
    name: $("editName").value.trim(),
    targetPosition: $("editTargetPosition").value.trim(),
    photo: $("editPhoto").value.trim(),
    about: $("editAbout").value.trim(),
    contacts: {
      email: $("editEmail").value.trim(),
      phone: $("editPhone").value.trim(),
      location: $("editLocation").value.trim(),
    },
    skills: splitLines($("editSkills").value),
    education: splitLines($("editEducation").value).map((line) => {
      const [degree = "", institution = ""] = line
        .split("|")
        .map((part) => part.trim());
      return { degree, institution };
    }),
    volunteering: splitLines($("editVolunteering").value).map((line) => {
      const [period, organization, ...descriptionParts] = line
        .split("|")
        .map((part) => part.trim());
      const description = descriptionParts.join(" | ");
      if (description) return { period, organization, description };
      return organization ? { period, description: organization } : period;
    }),
    languages: splitLines($("editLanguages").value).map((line) => {
      const [language = "", level = ""] = line
        .split("|")
        .map((part) => part.trim());
      return { language, level };
    }),
    experience: readExperienceEditor(),
  });
}

function applyEditorData({ close = false, notify = true } = {}) {
  const data = readEditorData();
  renderResume(data);
  saveLocalData();
  if (close) closeEditor();
  if (notify) showToast("Дані оновлено");
}

function renderExperienceEditor(items = []) {
  const editor = $("experienceEditor");
  editor.innerHTML = "";

  items.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "experience-card";
    card.innerHTML = `
      <div class="experience-card-header">
        <strong>Досвід ${index + 1}</strong>
        <button class="mini-btn danger" type="button">Видалити</button>
      </div>
      <label>
        Період
        <input data-field="period" type="text" value="${escapeAttribute(item.period)}" />
      </label>
      <label>
        Компанія
        <input data-field="company" type="text" value="${escapeAttribute(item.company)}" />
      </label>
      <label>
        Посада
        <input data-field="position" type="text" value="${escapeAttribute(item.position)}" />
      </label>
      <label>
        Обов'язки, по одному в рядку
        <textarea data-field="duties" rows="5">${escapeHtml((item.duties || []).join("\n"))}</textarea>
      </label>
    `;

    card.querySelector(".danger").addEventListener("click", () => {
      card.remove();
      applyEditorData();
    });

    editor.appendChild(card);
  });
}

function readExperienceEditor() {
  return [...$("experienceEditor").querySelectorAll(".experience-card")].map(
    (card) => ({
      period: card.querySelector('[data-field="period"]').value.trim(),
      company: card.querySelector('[data-field="company"]').value.trim(),
      position: card.querySelector('[data-field="position"]').value.trim(),
      duties: splitLines(card.querySelector('[data-field="duties"]').value),
    }),
  );
}

function addExperienceItem() {
  const current = readExperienceEditor();
  current.push({
    period: "",
    company: "",
    position: "",
    duties: [""],
  });
  renderExperienceEditor(current);
  applyEditorData();
}

function downloadJson() {
  const data = readEditorData();
  renderResume(data);
  saveLocalData();

  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "resume-data.json";
  link.click();
  URL.revokeObjectURL(url);
  showToast("JSON завантажено");
}

function resetData() {
  localStorage.removeItem(STORAGE_KEY);
  renderResume(FALLBACK_DATA);
  fillEditor(FALLBACK_DATA);
  showToast("Локальні зміни скинуто");
}

async function initResume() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const data = normalizeData(JSON.parse(saved));
      renderResume(data);
      fillEditor(data);
      return;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  try {
    const res = await fetch("resume-data.json");
    if (!res.ok) throw new Error();
    const data = normalizeData(await res.json());
    renderResume(data);
    fillEditor(data);
  } catch {
    renderResume(FALLBACK_DATA);
    fillEditor(FALLBACK_DATA);
  }
}

const FALLBACK_DATA = {
  name: "ЛЮДМИЛА КОКОУЛІНА",
  targetPosition: "",
  photo: "photo.jpg",
  about:
    "Фахівчиня з понад 10-річним досвідом роботи з документацією, базами даних, реєстрами та аналітичною звітністю. Маю практичний досвід збору, систематизації, перевірки та адміністрування даних, ведення електронних реєстрів і підготовки звітів. Працювала з CRM-системами, спеціалізованим програмним забезпеченням, Excel та іншими інструментами обробки даних. Добре розумію потреби вразливих категорій населення завдяки досвіду волонтерської діяльності. Пройшла навчання з кейс-менеджменту та моніторингу й оцінювання для громадських організацій. Відповідальна, уважна до деталей, дотримуюся принципів конфіденційності та якості даних.",
  contacts: {
    email: "liudmyla.s.k.18@gmail.com",
    phone: "+38 050 9746175",
    location: "м. Львів, Україна",
  },
  skills: [
    "Управління та адміністрування баз даних",
    "Збір, систематизація та перевірка даних",
    "Моніторинг та ведення звітності",
    "Аналіз інформації та підготовка аналітичних звітів",
    "MS Office, Google Workspace, CRM-системи та спеціалізоване програмне забезпечення",
    "Робота з документацією та електронними реєстрами",
    "Конфіденційність та захист персональних даних",
    "Уважність до деталей",
    "Аналітичне мислення",
    "Самоорганізація та відповідальність",
  ],
  education: [
    {
      degree: "Правознавство",
      institution:
        "Херсонський економіко-правовий інститут – диплом з відзнакою",
    },
    {
      degree: "Моніторинг і оцінювання для громадських організацій",
      institution:
        "освітня платформа «Зрозуміло!», програма «Стійкість», у партнерстві з Українською асоціацією оцінювання – сертифікат",
    },
    {
      degree: "Кейс-менеджмент у соціальній роботі",
      institution: "курс БФ «Право на захист» – сертифікат",
    },
  ],
  volunteering: [
    {
      period: "2023 – до теперішнього часу",
      organization: "ГО «Друзі спільноти святого Егідія»",
      description:
        "Підтримка ВПО (надання інформаційної підтримки та перенаправлення до доступних сервісів допомоги; видача гуманітарної допомоги; участь у реалізації благодійних ініціатив)",
    },
    {
      period: "2024–2025",
      organization: "Ініціатива групи волонтерок»",
      description:
        "Підтримка ЗСУ та медичної сфери (виготовлення, пакування, відправка маскувальних сіток і адаптивних подушок для військових підрозділів і госпіталів)",
    },
  ],
  languages: [
    { language: "Українська", level: "вільно" },
    { language: "English", level: "A2+/B1" },
  ],
  experience: [
    {
      period: "лютий 2018 – серпень 2021",
      company: "ТОВ «Херсонрегіонгаз»",
      position: "Юрисконсульт",
      duties: [
        "адмініструвала електронні реєстри договорів та внутрішні бази даних;",
        "забезпечувала актуальність, повноту та коректність даних;",
        "формувала аналітичну та статусну звітність щодо договірної роботи;",
        "здійснювала моніторинг виконання договірних зобов'язань та контроль строків;",
        "взаємодіяла з контрагентами та внутрішніми підрозділами для збору й уточнення інформації;",
        "працювала з тендерною документацією та платформою ProZorro;",
        "здійснювала моніторинг ключових ринкових показників та формувала аналітичну звітність;",
        "забезпечувала інформаційну підтримку процесів прийняття рішень на основі аналізу даних",
      ],
    },
    {
      period: "жовтень 2009 – лютий 2018",
      company: "",
      position: "Приватна юридична практика",
      duties: [
        "здійснювала збір, аналіз та систематизацію інформації для підготовки документів і супроводу клієнтів;",
        "працювала одночасно з великою кількістю кейсів і документів;",
        "координувала взаємодію між клієнтами, державними органами та іншими установами;",
        "забезпечувала конфіденційність персональних даних",
      ],
    },
    {
      period: "листопад 2007 – березень 2009",
      company: "ЗАТ «Догмат Україна» / «СК Догмат Страхування»",
      position: "Юрисконсульт",
      duties: [
        "готувала документи та супроводжувала справи;",
        "забезпечувала примусове виконання рішень суду;",
        "формувала звітність і забезпечувала актуальність інформації в облікових системах",
      ],
    },
  ],
};

document.addEventListener("DOMContentLoaded", () => {
  $("reloadDataBtn")?.addEventListener("click", loadData);
  $("editDataBtn")?.addEventListener("click", openEditor);
  $("savePdfBtn")?.addEventListener("click", savePDF);
  $("closeEditorBtn")?.addEventListener("click", closeEditor);
  $("applyDataBtn")?.addEventListener("click", () =>
    applyEditorData({ close: true }),
  );
  $("downloadJsonBtn")?.addEventListener("click", downloadJson);
  $("resetDataBtn")?.addEventListener("click", resetData);
  $("addExperienceBtn")?.addEventListener("click", addExperienceItem);
  $("editorOverlay")?.addEventListener("click", (event) => {
    if (event.target === $("editorOverlay")) closeEditor();
  });
  $("resumeEditor")?.addEventListener("input", () => {
    applyEditorData({ notify: false });
    scheduleAutoSave();
  });

  initResume();
});
