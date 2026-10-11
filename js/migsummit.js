/* =====================================================================
   CONFIGURAÇÃO DO EVENTO
   Valores desconhecidos ficam null/vazios. Seções condicionais somem
   automaticamente quando não há conteúdo aprovado.
   ===================================================================== */
const CONFIG = {
  reviewMode: true,              // true (prévia): mostra Lorem ipsum onde faltam dados. false (produção): esconde o que não estiver preenchido
  eventDate: null,               // ex.: "2026-11-25"  (exibido como "25 de novembro de 2026")
  eventTime: null,               // ex.: "9h às 13h"
  timezone: null,                // ex.: "horário de Brasília"
  venue: null,                   // ex.: "São Paulo, SP" ou nome da plataforma
  eventFormat: null,             // "presencial" | "online" | "híbrido"
  registrationMode: "open",      // "open" (inscrição) | "approval" (sujeita a análise) | "preregistration" (pré-cadastro)
  registrationEndpoint: null,    // URL que recebe POST JSON. null = modo demonstração
  confirmationEmailEnabled: false, // true somente se o e-mail automático estiver configurado
  privacyUrl: null,
  termsUrl: null,
  contactEmail: null,
  speakers: [],                  // { name, role, organization, topic, photo, photoAlt }
  agenda: [],                    // { time, title, format, participants }
  faq: [],                      // { q, a }  somente respostas confirmadas
  calendar: null                 // { start: "2026-11-25T09:00:00-03:00", end: "2026-11-25T13:00:00-03:00" } ativa "Adicionar à agenda" e o schema Event
};

const COPY = {
  ctaLabel: { open: "Quero participar", approval: "Quero participar", preregistration: "Quero participar" },
  formTitle: { open: "Inscreva-se no MIGSUMMIT", approval: "Inscreva-se no MIGSUMMIT", preregistration: "Inscreva-se no MIGSUMMIT" },
  success: {
    openEmail: { title: "Inscrição recebida.", text: "Confira seu e-mail para acompanhar as informações do MIGSUMMIT." },
    open: { title: "Inscrição recebida.", text: "Vamos usar o e-mail informado para enviar as próximas informações do MIGSUMMIT." },
    approval: { title: "Recebemos sua solicitação.", text: "Acompanhe o retorno pelo canal informado." },
    preregistration: { title: "Cadastro recebido.", text: "Você vai receber as novidades do MIGSUMMIT no e-mail informado." }
  }
};

/* ---------- analytics (sem dados pessoais) ---------- */
window.dataLayer = window.dataLayer || [];
function track(event, params){ try { window.dataLayer.push(Object.assign({ event }, params || {})); } catch(e){} }

/* ---------- UTMs e origem ---------- */
const attribution = (() => {
  const out = {};
  try {
    const p = new URLSearchParams(location.search);
    ["utm_source","utm_medium","utm_campaign","utm_term","utm_content"].forEach(k => { if (p.get(k)) out[k] = p.get(k); });
    if (document.referrer) out.referrer = document.referrer;
  } catch(e){}
  out.landing_page = location.origin + location.pathname;
  return out;
})();

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const LOREM = {
  "[DATA]": "Lorem ipsum dolor",
  "[HORÁRIO E FUSO]": "Sit amet, consectetur",
  "[LOCAL OU PLATAFORMA]": "Adipiscing elit",
  footer: "Lorem ipsum dolor sit amet",
  privacy: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
};
const pending = key => `<span class="ph">${esc(LOREM[key] || "Lorem ipsum")}</span>`;

/* ---------- fase do evento: rótulos dos CTAs ---------- */
const mode = COPY.ctaLabel[CONFIG.registrationMode] ? CONFIG.registrationMode : "open";
$$("[data-cta-label]").forEach(el => el.textContent = COPY.ctaLabel[mode]);
$("#formTitle").textContent = COPY.formTitle[mode];

/* ---------- dados do evento no hero ---------- */
(function renderMeta(){
  const ul = $("#eventMeta");
  const icons = {
    date: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    time: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    place: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/></svg>'
  };
  let dateTxt = null;
  if (CONFIG.eventDate) {
    try { dateTxt = new Date(CONFIG.eventDate + "T12:00:00").toLocaleDateString("pt-BR", { day:"numeric", month:"long", year:"numeric" }); } catch(e){ dateTxt = CONFIG.eventDate; }
  }
  const timeTxt = CONFIG.eventTime ? [CONFIG.eventTime, CONFIG.timezone].filter(Boolean).join(", ") : null;
  const placeTxt = CONFIG.venue ? [CONFIG.venue, CONFIG.eventFormat].filter(Boolean).join(" · ") : null;
  const items = [
    ["date", dateTxt, "[DATA]"],
    ["time", timeTxt, "[HORÁRIO E FUSO]"],
    ["place", placeTxt, "[LOCAL OU PLATAFORMA]"]
  ].filter(([, v]) => v);   // data, horário e local só aparecem quando confirmados
  if (!items.length) { ul.hidden = true; return; }
  ul.innerHTML = items.map(([k, v, ph]) => `<li>${icons[k]}${v ? esc(v) : pending(ph)}</li>`).join("");
  // no banner, só dados confirmados (sem marcadores sobre a arte)
  const confirmed = items.filter(([, v]) => v);
  if (confirmed.length) { const hm = $("#heroMeta"); hm.innerHTML = confirmed.map(([k, v]) => `<li>${icons[k]}${esc(v)}</li>`).join(""); hm.hidden = false; }
})();

/* ---------- especialistas / programação / faq ---------- */
(function renderConditional(){
  const sp = (CONFIG.speakers || []).filter(s => s && s.name);
  if (sp.length) {
    $("#speakersList").innerHTML = sp.map(s => `
      <li class="person card" style="padding:var(--space-4)">
        ${s.photo ? `<img src="${esc(s.photo)}" alt="${esc(s.photoAlt || s.name)}" loading="lazy">` : ""}
        <div><p class="person__name">${esc(s.name)}</p>
        <p class="person__role">${esc([s.role, s.organization].filter(Boolean).join(", "))}</p>
        ${s.topic ? `<p class="card__text" style="margin-top:var(--space-2)">${esc(s.topic)}</p>` : ""}</div>
      </li>`).join("");
    $("#especialistas").hidden = false;
    $$('[data-nav="speakers"]').forEach(el => el.hidden = false);
  }
  const ag = (CONFIG.agenda || []).filter(a => a && a.title);
  if (ag.length) {
    $("#agendaList").innerHTML = ag.map(a => `
      <li class="agenda__item"><span class="agenda__time">${esc(a.time)}</span>
      <div><p style="font-size:var(--text-body-l);font-weight:500">${esc(a.title)}</p>
      <p style="color:var(--text-2);font-size:var(--text-body-s)">${esc([a.format, a.participants].filter(Boolean).join(" · "))}</p></div></li>`).join("");
    $("#programacao").hidden = false;
    $$('[data-nav="agenda"]').forEach(el => el.hidden = false);
  }
  const fq = (CONFIG.faq || []).filter(f => f && f.q && f.a);
  if (fq.length) {
    $("#faqList").innerHTML = fq.map((f, i) => `
      <div class="accordion__item" data-state="closed">
        <button class="accordion__trigger" type="button" aria-expanded="false" aria-controls="faq-${i}" id="faq-t-${i}">
          <span class="accordion__title">${esc(f.q)}</span><span class="accordion__icon" aria-hidden="true"></span>
        </button>
        <div class="accordion__content" id="faq-${i}" role="region" aria-labelledby="faq-t-${i}">
          <div class="accordion__content-inner"><div class="accordion__body">${esc(f.a)}</div></div>
        </div>
      </div>`).join("");
    $("#duvidas").hidden = false;
    $$("#faqList .accordion__trigger").forEach(btn => btn.addEventListener("click", () => {
      const item = btn.closest(".accordion__item");
      const open = item.dataset.state !== "open";
      item.dataset.state = open ? "open" : "closed";
      btn.setAttribute("aria-expanded", String(open));
    }));
  }
})();

/* ---------- rodapé e aviso de privacidade ---------- */
(function renderLegal(){
  const links = [];
  if (CONFIG.privacyUrl) links.push(`<a href="${esc(CONFIG.privacyUrl)}">Política de privacidade</a>`);
  if (CONFIG.termsUrl) links.push(`<a href="${esc(CONFIG.termsUrl)}">Condições de participação</a>`);
  if (CONFIG.contactEmail) links.push(`<span>Contato: <a href="mailto:${esc(CONFIG.contactEmail)}">${esc(CONFIG.contactEmail)}</a></span>`);
  if (!links.length && CONFIG.reviewMode) links.push(pending("footer"));
  $("#footerLinks").innerHTML = links.join("");

  const note = $("#privacyNote");
  if (CONFIG.privacyUrl) {
    note.innerHTML = `Usaremos seus dados para a gestão da sua participação no MIGSUMMIT, conforme a <a href="${esc(CONFIG.privacyUrl)}">Política de Privacidade</a>.`;
  } else if (CONFIG.reviewMode) {
    note.innerHTML = pending("privacy");
  } else { note.hidden = true; }
  $("#year").textContent = new Date().getFullYear();
})();

/* ---------- navegação ---------- */
const navbar = $("#navbar"), menuBtn = $("#menuBtn"), mobileNav = $("#mobileNav");
function setMenu(open){
  navbar.dataset.menuState = open ? "open" : "closed";
  mobileNav.hidden = !open;
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
}
menuBtn.addEventListener("click", () => setMenu(mobileNav.hidden));
mobileNav.addEventListener("click", e => { if (e.target.closest("a")) setMenu(false); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !mobileNav.hidden) { setMenu(false); menuBtn.focus(); } });
addEventListener("resize", () => { if (innerWidth > 991 && !mobileNav.hidden) setMenu(false); });
addEventListener("scroll", () => navbar.classList.toggle("is-scrolled", scrollY > 8), { passive:true });

$$("[data-cta]").forEach(a => a.addEventListener("click", () => track("cta_click", { cta_location: a.dataset.cta, registration_mode: mode })));

/* ---------- formulário ---------- */
const form = $("#signupForm"), submitBtn = $("#submitBtn"), statusBox = $("#formStatus");
const isDemo = !CONFIG.registrationEndpoint;

const rules = {
  nome:   v => v.trim().length >= 3 && /\s/.test(v.trim()) ? "" : "Informe seu nome e sobrenome.",
  email:  v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Informe um e-mail válido, como nome@empresa.com.br.",
  empresa:v => v.trim().length >= 2 ? "" : "Informe o nome da empresa.",
  cargo:  v => v.trim().length >= 2 ? "" : "Informe seu cargo ou área de atuação."
};
function validateField(name){
  const input = form.elements[name], wrap = input.closest(".field"), err = $("#e-" + name);
  const msg = rules[name](input.value);
  wrap.classList.toggle("has-error", !!msg);
  input.setAttribute("aria-invalid", msg ? "true" : "false");
  err.textContent = msg;
  return !msg;
}
let started = false, sending = false;
form.addEventListener("input", e => {
  if (!started) { started = true; track("form_start", { registration_mode: mode }); }
  const name = e.target.name;
  if (name && e.target.closest(".field").classList.contains("has-error")) validateField(name);
});
form.addEventListener("focusout", e => { const n = e.target.name; if (n && e.target.value) validateField(n); });

function showStatus(kind, title, text){
  const icon = kind === "success"
    ? '<path d="m5 12.5 4.5 4.5L19 7.5"/>'
    : '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>';
  statusBox.innerHTML = `<div class="notice is-${kind}" role="status"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg><div><strong>${esc(title)}</strong>${esc(text)}</div></div>`;
}
function setSending(on){
  sending = on;
  submitBtn.classList.toggle("is-loading", on);
  submitBtn.setAttribute("aria-busy", String(on));
  submitBtn.disabled = on;
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  if (sending) return;                              // evita envio duplicado
  statusBox.innerHTML = "";
  const names = Object.keys(rules);
  const ok = names.map(validateField).every(Boolean);
  if (!ok) { const first = names.find(n => form.elements[n].closest(".field").classList.contains("has-error")); form.elements[first].focus(); return; }

  if (isDemo) {
    showStatus("info", "Envio desativado nesta prévia.", "Os dados foram validados, mas nada foi enviado. O formulário será conectado na versão final.");
    return;                                          // sem confirmação fictícia
  }

  const payload = Object.fromEntries(names.map(n => [n, form.elements[n].value.trim()]));
  payload.registration_mode = mode;
  payload.attribution = attribution;
  setSending(true);
  try {
    const res = await fetch(CONFIG.registrationEndpoint, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const msg = mode === "open" ? (CONFIG.confirmationEmailEnabled ? COPY.success.openEmail : COPY.success.open) : COPY.success[mode];
    showStatus("success", msg.title, msg.text);
    const share = document.createElement("div");
    share.className = "share";
    share.innerHTML = `<span>Convide colegas que também atuam com SAP:</span><button type="button" class="btn-pill is-sm" id="copyLink"><span class="btn-pill__inner"><span class="btn-pill__text">Copiar link do evento</span></span></button>`;
    statusBox.appendChild(share);
    $("#copyLink").addEventListener("click", async e => {
      const link = location.origin + location.pathname, t = e.currentTarget.querySelector(".btn-pill__text");
      try { await navigator.clipboard.writeText(link); t.textContent = "Link copiado"; } catch(_) { t.textContent = link; }
      track("share_click", { method: "copy_link" });
    });
    track("form_submit_success", { registration_mode: mode });
    form.reset(); started = false;
    names.forEach(n => form.elements[n].setAttribute("aria-invalid", "false"));
  } catch(err) {
    showStatus("danger", "Não foi possível enviar agora.", "Seus dados continuam preenchidos. Verifique a conexão e tente novamente em alguns instantes.");
    track("form_submit_error", { registration_mode: mode, error_type: String(err && err.message || "network").slice(0, 40) });
  } finally { setSending(false); }
});
/* ---------- navegação ativa por seção ---------- */
(function scrollSpy(){
  const links = $$(".navbar__links a[href^='#']");
  const map = new Map(links.map(a => [a.getAttribute("href").slice(1), a]));
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { links.forEach(l => { l.classList.remove("is-active"); l.removeAttribute("aria-current"); }); const a = map.get(en.target.id); if (a) { a.classList.add("is-active"); a.setAttribute("aria-current", "true"); } } });
  }, { rootMargin: "-45% 0px -50% 0px" });
  map.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
})();

/* ---------- barra de CTA fixa no mobile ---------- */
(function stickyCta(){
  const bar = $("#stickyCta"), heroCta = $('[data-cta="hero"]'), signup = $("#inscricao");
  let heroVisible = true, signupVisible = false;
  const update = () => {
    const show = !heroVisible && !signupVisible;
    bar.classList.toggle("is-visible", show);
    bar.setAttribute("aria-hidden", String(!show));
    bar.querySelector("a").tabIndex = show ? 0 : -1;
    document.body.classList.toggle("has-sticky", show);
  };
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; update(); }).observe(heroCta);
  new IntersectionObserver(([e]) => { signupVisible = e.isIntersecting; update(); }, { threshold: .15 }).observe(signup);
})();

/* ---------- CTA leva direto ao primeiro campo ---------- */
$$('a[href="#inscricao"]').forEach(a => a.addEventListener("click", () => {
  setTimeout(() => { const f = $("#f-nome"); if (f && !f.value) f.focus({ preventScroll: true }); }, 650);
}));

/* ---------- brilho que segue o cursor nos cards ---------- */
if (matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches) {
  $$(".card.has-glow").forEach(c => c.addEventListener("pointermove", e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty("--glow-x", (e.clientX - r.left) + "px");
    c.style.setProperty("--glow-y", (e.clientY - r.top) + "px");
  }));
}

/* ---------- agenda e dados estruturados (somente com dados confirmados) ---------- */
(function calendarAndSchema(){
  const c = CONFIG.calendar;
  if (!c || !c.start || !c.end) return;
  const fmt = d => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const url = "https://calendar.google.com/calendar/render?action=TEMPLATE"
    + "&text=" + encodeURIComponent("MIGSUMMIT | IA aplicada ao ambiente SAP")
    + "&dates=" + fmt(c.start) + "/" + fmt(c.end)
    + (CONFIG.venue ? "&location=" + encodeURIComponent(CONFIG.venue) : "")
    + "&details=" + encodeURIComponent(location.origin + location.pathname);
  const li = document.createElement("li");
  li.innerHTML = `<a class="btn-text" href="${url}" target="_blank" rel="noopener" data-cta="calendar">Adicionar à agenda</a>`;
  $("#eventMeta").appendChild(li);
  li.querySelector("a").addEventListener("click", () => track("cta_click", { cta_location: "calendar" }));
  if (CONFIG.reviewMode) return;
  const ld = { "@context":"https://schema.org", "@type":"Event", name:"MIGSUMMIT", startDate:c.start, endDate:c.end,
    eventAttendanceMode: CONFIG.eventFormat === "online" ? "https://schema.org/OnlineEventAttendanceMode" : CONFIG.eventFormat === "híbrido" ? "https://schema.org/MixedEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
    organizer:{ "@type":"Organization", name:"MIGNOW" }, description: document.querySelector('meta[name="description"]').content };
  if (CONFIG.venue) ld.location = CONFIG.eventFormat === "online" ? { "@type":"VirtualLocation", url: CONFIG.venue } : { "@type":"Place", name: CONFIG.venue };
  const sc = document.createElement("script"); sc.type = "application/ld+json"; sc.textContent = JSON.stringify(ld); document.head.appendChild(sc);
})();
