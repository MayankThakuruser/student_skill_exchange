/* =========================================================
   Skill Swap — app logic (vanilla ES6+)
   Flow: state (profiles[]) → filter → render() → DOM
   ========================================================= */

// ---------- 1. State ----------
const profiles = [
  { id: 1, name: "Aarav M.",  major: "Computer Science, Year 1", offer: ["Python", "C++ basics"],
    want: ["Guitar"], category: "Programming & Tech", contact: "aarav.m@uni.edu",
    bio: "Can explain loops and pointers without the jargon. Free after 4pm." },
  { id: 2, name: "Lena K.",   major: "Mathematics, Year 1", offer: ["Discrete Math", "Calculus I"],
    want: ["Web Dev"], category: "Academics & Math", contact: "lena#4821",
    bio: "Proofs finally clicked for me this term. Let's make them click for you." },
  { id: 3, name: "Diego R.",  major: "Business, Year 1", offer: ["Spanish", "Excel"],
    want: ["German"], category: "Languages", contact: "diego.r@uni.edu",
    bio: "Native Spanish speaker. Happy to swap over coffee at the union." },
  { id: 4, name: "Sana P.",   major: "Electronics, Year 1", offer: ["Weightlifting", "Meal prep"],
    want: ["C++", "Data Structures"], category: "Fitness & Hobbies", contact: "sana_p#0912",
    bio: "Can build you a beginner gym plan. I need help surviving DSA." },
  { id: 5, name: "Tom W.",    major: "Physics, Year 1", offer: ["Linear Algebra", "Physics I"],
    want: ["Public speaking"], category: "Academics & Math", contact: "tom.w@uni.edu",
    bio: "Study-group friendly. Whiteboard sessions in the library." },
  { id: 6, name: "Mei L.",    major: "Design, Year 1", offer: ["Mandarin", "Figma"],
    want: ["Python"], category: "Languages", contact: "meil#7733",
    bio: "I'll teach you tones, you teach me to automate my homework." },
  { id: 7, name: "Jonas B.",  major: "Computer Science, Year 1", offer: ["German", "Git"],
    want: ["Guitar", "Calculus I"], category: "Programming & Tech", contact: "jonas.b@uni.edu",
    bio: "German speaker from Hamburg. Git saved my project twice already." },
];

let nextId = profiles.length + 1;
let activeProfile = null;        // profile shown in the swap modal
let newestId = null;             // used to flash a just-posted card

// ---------- 2. DOM references ----------
const $ = (sel) => document.querySelector(sel);
const grid = $("#cardGrid");
const emptyState = $("#emptyState");
const resultCount = $("#resultCount");
const searchInput = $("#searchInput");
const categoryFilter = $("#categoryFilter");
const postModal = $("#postModal");
const postForm = $("#postForm");
const formError = $("#formError");
const swapModal = $("#swapModal");
const toastEl = $("#toast");

// ---------- 3. Helpers ----------
// Escape user text before putting it in innerHTML (blocks script injection)
const escapeHTML = (str) =>
  String(str).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// "Python, C++" → ["Python", "C++"]
const splitSkills = (str) =>
  str.split(",").map((s) => s.trim()).filter(Boolean);

const badges = (skills) =>
  `<div class="badges">${skills.map((s) => `<span class="badge">${escapeHTML(s)}</span>`).join("")}</div>`;

let toastTimer;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
}

// ---------- 4. Rendering ----------
function cardTemplate(p) {
  return `
    <article class="card ${p.id === newestId ? "is-new" : ""}">
      <div class="card-head">
        <div class="avatar" aria-hidden="true">${escapeHTML(p.name.charAt(0).toUpperCase())}</div>
        <div>
          <h3 class="card-name">${escapeHTML(p.name)}</h3>
          <p class="card-meta">${escapeHTML(p.major)}</p>
        </div>
      </div>

      <div class="swap">
        <div class="swap-row teach"><span class="swap-label">Can teach</span>${badges(p.offer)}</div>
        <div class="swap-row learn"><span class="swap-label">Wants to learn</span>${badges(p.want)}</div>
      </div>

      ${p.bio ? `<p class="card-bio">${escapeHTML(p.bio)}</p>` : `<p class="card-bio"></p>`}

      <div class="card-foot">
        <span class="category">${escapeHTML(p.category)}</span>
        <button class="btn btn-primary" type="button" data-swap="${p.id}">Request skill swap</button>
      </div>
    </article>`;
}

// Applies the search text + category filter, then redraws the grid
function render() {
  const query = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;

  const visible = profiles.filter((p) => {
    const matchesCategory = category === "all" || p.category === category;
    // Search matches either skills offered or skills wanted
    const matchesText =
      !query || [...p.offer, ...p.want].some((s) => s.toLowerCase().includes(query));
    return matchesCategory && matchesText;
  });

  grid.innerHTML = visible.map(cardTemplate).join("");
  emptyState.hidden = visible.length > 0;
  resultCount.textContent = `${visible.length} swap${visible.length === 1 ? "" : "s"} available`;
  newestId = null; // the flash only plays once
}

// ---------- 5. Events: search & filter (live, no submit needed) ----------
searchInput.addEventListener("input", render);
categoryFilter.addEventListener("change", render);

// ---------- 6. Events: "Request skill swap" (event delegation on the grid) ----------
grid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-swap]");
  if (!btn) return;
  activeProfile = profiles.find((p) => p.id === Number(btn.dataset.swap));
  openSwapModal(activeProfile);
});

function openSwapModal(p) {
  $("#swapSummary").textContent =
    `${p.name} can teach ${p.offer.join(", ")} and wants to learn ${p.want.join(", ")}.`;
  $("#swapContact").textContent = p.contact;

  // Pre-formatted message the student can edit before sending
  $("#swapMessage").value =
`Hi ${p.name.split(" ")[0]},

I saw your post on Skill Swap. I'd love to learn ${p.offer[0]} from you.
In exchange, I can help you with ${p.want[0]}: [add what you can teach].

Are you free this week to meet up or hop on a call?

Thanks,
[Your name]`;

  // Only offer "Open in email" when the contact looks like an email address
  const mail = $("#mailLink");
  const isEmail = /^\S+@\S+\.\S+$/.test(p.contact);
  mail.hidden = !isEmail;
  if (isEmail) updateMailLink();

  swapModal.showModal();
}

function updateMailLink() {
  const body = encodeURIComponent($("#swapMessage").value);
  $("#mailLink").href = `mailto:${activeProfile.contact}?subject=${encodeURIComponent("Skill swap?")}&body=${body}`;
}
$("#swapMessage").addEventListener("input", () => activeProfile && updateMailLink());

$("#copyBtn").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("#swapMessage").value);
    showToast("Message copied");
  } catch {
    // Clipboard API can be blocked on file:// pages, so select the text instead
    $("#swapMessage").select();
    showToast("Press Ctrl/Cmd + C to copy");
  }
});

// ---------- 7. Events: "Post your skill exchange" ----------
$("#openPostBtn").addEventListener("click", () => {
  formError.hidden = true;
  postModal.showModal();
});

postForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(postForm));
  const offer = splitSkills(data.offer || "");
  const want = splitSkills(data.want || "");

  // Basic validation with a friendly message
  if (!data.name.trim() || !data.major.trim() || !data.contact.trim() || !data.category) {
    return showError("Fill in your name, major, category and contact.");
  }
  if (!offer.length || !want.length) {
    return showError("Add at least one skill to offer and one to request.");
  }

  const profile = {
    id: nextId++,
    name: data.name.trim(),
    major: `${data.major.trim()}, Year 1`,
    offer, want,
    category: data.category,
    contact: data.contact.trim(),
    bio: (data.bio || "").trim(),
  };

  profiles.unshift(profile);   // newest first
  newestId = profile.id;

  // Reset filters so the new card is visible straight away
  searchInput.value = "";
  categoryFilter.value = "all";
  render();

  postForm.reset();
  postModal.close();
  showToast("Posted. Your card is live.");
});

function showError(msg) {
  formError.textContent = msg;
  formError.hidden = false;
}

// ---------- 8. Modal closing: × / Cancel buttons and backdrop click ----------
document.querySelectorAll("[data-close]").forEach((btn) =>
  btn.addEventListener("click", () => btn.closest("dialog").close()));

document.querySelectorAll("dialog").forEach((dlg) =>
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); }));

// ---------- 9. Start ----------
render();
