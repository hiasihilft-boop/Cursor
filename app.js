/* Hiasi hilft vor Ort – Auftragsbestätigung
   Schlanke Web-App ohne Server. Speicherung lokal im Browser (localStorage). */

(function () {
  "use strict";

  const STORE_KEY = "hiasi_auftraege";
  const NR_KEY = "hiasi_next_nr";

  // ---------- Hilfsfunktionen ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(t._timer);
    t._timer = setTimeout(() => (t.hidden = true), 2200);
  }

  function loadStore() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }
  function saveStore(list) {
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
  }

  function nextNr() {
    const n = parseInt(localStorage.getItem(NR_KEY) || "1", 10);
    return isNaN(n) ? 1 : n;
  }
  function bumpNr(current) {
    const n = parseInt(current, 10);
    if (!isNaN(n)) localStorage.setItem(NR_KEY, String(n + 1));
  }

  function todayISO() {
    const d = new Date();
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
  }
  function nowTime() {
    return new Date().toTimeString().slice(0, 5);
  }

  // ---------- Leistungspositionen ----------
  function addLeistung(value) {
    const li = document.createElement("li");
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Position eingeben …";
    input.value = value || "";
    const del = document.createElement("button");
    del.type = "button";
    del.className = "del no-print";
    del.title = "Position entfernen";
    del.textContent = "×";
    del.addEventListener("click", () => {
      li.remove();
      if ($("#leistungen").children.length === 0) addLeistung("");
    });
    li.appendChild(input);
    li.appendChild(del);
    $("#leistungen").appendChild(li);
    return input;
  }

  function getLeistungen() {
    return $$("#leistungen li input")
      .map((i) => i.value.trim())
      .filter(Boolean);
  }

  // ---------- Unterschriften (Canvas) ----------
  const pads = {};
  function setupPad(id) {
    const canvas = $("#sig-" + id);
    const ctx = canvas.getContext("2d");
    let drawing = false;
    let dirty = false;

    function resize() {
      // Auflösung an angezeigte Größe anpassen (scharfe Linien)
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const data = dirty ? canvas.toDataURL() : null;
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1a2a4f";
      if (data) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
        img.src = data;
      }
    }

    function pos(e) {
      const rect = canvas.getBoundingClientRect();
      const p = e.touches ? e.touches[0] : e;
      return { x: p.clientX - rect.left, y: p.clientY - rect.top };
    }
    function start(e) {
      e.preventDefault();
      drawing = true;
      dirty = true;
      const { x, y } = pos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
    function move(e) {
      if (!drawing) return;
      e.preventDefault();
      const { x, y } = pos(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    function end() { drawing = false; }

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", end);

    setTimeout(resize, 0);
    window.addEventListener("resize", resize);

    pads[id] = {
      clear() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        dirty = false;
      },
      isEmpty: () => !dirty,
      toDataURL: () => (dirty ? canvas.toDataURL("image/png") : ""),
      fromDataURL(url) {
        this.clear();
        if (!url) return;
        const rect = canvas.getBoundingClientRect();
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
          dirty = true;
        };
        img.src = url;
      },
    };
  }

  // ---------- Betrag / Gesamt ----------
  function recomputeGesamt() {
    const betrag = parseFloat($("#f-betrag").value);
    const einheit = $("#f-betrag-einheit").value;
    const stunden = parseFloat($("#f-stunden").value);
    let gesamt = null;
    if (!isNaN(betrag)) {
      if (einheit === "pauschal") gesamt = betrag;
      else if (!isNaN(stunden)) gesamt = betrag * stunden;
    }
    $("#f-gesamt").textContent =
      gesamt === null ? "—" : gesamt.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function syncEinheitMitArt() {
    const pauschal = $("#art-pauschal").checked;
    $("#f-betrag-einheit").value = pauschal ? "pauschal" : "/h";
    recomputeGesamt();
  }

  // ---------- Formular <-> Datenobjekt ----------
  function collect() {
    return {
      nr: $("#f-nr").value.trim(),
      datum: $("#f-datum").value,
      uhrzeit: $("#f-uhrzeit").value,
      kunde: $("#f-kunde").value.trim(),
      objekt: $("#f-objekt").value.trim(),
      leistungen: getLeistungen(),
      material: $("#f-material").value.trim(),
      email: $("#f-email").value.trim(),
      telefon: $("#f-telefon").value.trim(),
      sonstiges: $("#f-sonstiges").value.trim(),
      art: $("#art-pauschal").checked ? "pauschal" : "stundensatz",
      betrag: $("#f-betrag").value,
      betragEinheit: $("#f-betrag-einheit").value,
      stunden: $("#f-stunden").value,
      ortdatum: $("#f-ortdatum").value.trim(),
      sigKunde: pads.kunde ? pads.kunde.toDataURL() : "",
      sigHiasi: pads.hiasi ? pads.hiasi.toDataURL() : "",
      gespeichert: new Date().toISOString(),
    };
  }

  function apply(d) {
    $("#f-nr").value = d.nr || "";
    $("#f-datum").value = d.datum || "";
    $("#f-uhrzeit").value = d.uhrzeit || "";
    $("#f-kunde").value = d.kunde || "";
    $("#f-objekt").value = d.objekt || "";
    $("#f-material").value = d.material || "";
    $("#f-email").value = d.email || "";
    $("#f-telefon").value = d.telefon || "";
    $("#f-sonstiges").value = d.sonstiges || "";
    if (d.art === "pauschal") $("#art-pauschal").checked = true;
    else $("#art-stundensatz").checked = true;
    $("#f-betrag").value = d.betrag || "";
    $("#f-betrag-einheit").value = d.betragEinheit || "/h";
    $("#f-stunden").value = d.stunden || "";
    $("#f-ortdatum").value = d.ortdatum || "";

    $("#leistungen").innerHTML = "";
    const list = d.leistungen && d.leistungen.length ? d.leistungen : [""];
    list.forEach((l) => addLeistung(l));

    if (pads.kunde) pads.kunde.fromDataURL(d.sigKunde || "");
    if (pads.hiasi) pads.hiasi.fromDataURL(d.sigHiasi || "");
    recomputeGesamt();
  }

  // Erster, fest bestätigter Auftrag (Erica Biechler) als Startdatensatz.
  function ersterAuftrag() {
    return {
      nr: "1",
      datum: "2026-07-20",
      uhrzeit: "",
      kunde: "Erica Biechler",
      objekt: "Gartenanlage Tochtermann Garten",
      leistungen: [
        "Magnolie auslichten / formen",
        "Rosenbogen formen",
        "Bambus schneiden, wenn möglich raus",
        "12 Eibenhecke schneiden / ausdünnen",
        "Hasel hinter Gartenhaus raus",
        "Strauch hinter Dusche raus",
      ],
      material: "2 Sack Erde 60L, 2 Sack Rindenmulch",
      email: "freu.bie@t-online.de",
      telefon: "0821/156713",
      sonstiges: "",
      art: "stundensatz",
      betrag: "40",
      betragEinheit: "/h",
      stunden: "",
      ortdatum: "",
      sigKunde: "",
      sigHiasi: "",
      gespeichert: new Date("2026-07-20T00:00:00").toISOString(),
    };
  }

  // Legt den ersten Auftrag einmalig an (nur wenn noch nichts gespeichert ist).
  function seedErsterAuftrag() {
    const list = loadStore();
    if (list.length > 0) return false;
    if (parseInt(localStorage.getItem(NR_KEY) || "1", 10) !== 1) return false;
    const seed = ersterAuftrag();
    saveStore([seed]);
    localStorage.setItem(NR_KEY, "2");
    return true;
  }

  function newAuftrag() {
    apply({ leistungen: [""] });
    $("#f-nr").value = String(nextNr());
    $("#f-datum").value = todayISO();
    $("#f-uhrzeit").value = nowTime();
    $("#art-stundensatz").checked = true;
    $("#f-betrag").value = "40";
    $("#f-betrag-einheit").value = "/h";
    if (pads.kunde) pads.kunde.clear();
    if (pads.hiasi) pads.hiasi.clear();
    recomputeGesamt();
  }

  // ---------- Speichern / Liste ----------
  function saveCurrent() {
    const data = collect();
    if (!data.kunde) {
      toast("Bitte mindestens den Kunden eintragen.");
      $("#f-kunde").focus();
      return;
    }
    const list = loadStore();
    const idx = list.findIndex((x) => x.nr && x.nr === data.nr);
    if (idx >= 0) list[idx] = data;
    else {
      list.push(data);
      bumpNr(data.nr);
    }
    saveStore(list);
    toast("Auftrag gespeichert.");
  }

  function renderList() {
    const ul = $("#auftrag-list");
    ul.innerHTML = "";
    const list = loadStore().slice().reverse();
    if (list.length === 0) {
      ul.innerHTML = '<li><span class="meta"><strong>Noch keine Aufträge</strong></span></li>';
      return;
    }
    list.forEach((d) => {
      const li = document.createElement("li");
      const meta = document.createElement("span");
      meta.className = "meta";
      meta.innerHTML =
        "<strong>Nr. " + (d.nr || "?") + " – " + (d.kunde || "ohne Namen") + "</strong>" +
        "<small>" + (d.datum || "") + (d.objekt ? " · " + d.objekt : "") + "</small>";
      const actions = document.createElement("span");
      actions.className = "actions";

      const openBtn = document.createElement("button");
      openBtn.className = "btn btn-mini";
      openBtn.textContent = "Öffnen";
      openBtn.addEventListener("click", () => {
        apply(d);
        closeList();
        toast("Auftrag geladen.");
      });

      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-mini";
      delBtn.style.background = "#c0392b";
      delBtn.style.borderColor = "#a5301f";
      delBtn.textContent = "Löschen";
      delBtn.addEventListener("click", () => {
        if (!confirm("Auftrag Nr. " + (d.nr || "?") + " wirklich löschen?")) return;
        const all = loadStore().filter((x) => x.gespeichert !== d.gespeichert);
        saveStore(all);
        renderList();
      });

      actions.appendChild(openBtn);
      actions.appendChild(delBtn);
      li.appendChild(meta);
      li.appendChild(actions);
      ul.appendChild(li);
    });
  }

  function openList() {
    renderList();
    $("#overlay").hidden = false;
  }
  function closeList() {
    $("#overlay").hidden = true;
  }

  // ---------- Init ----------
  function init() {
    setupPad("kunde");
    setupPad("hiasi");

    $("#btn-add-leistung").addEventListener("click", () => addLeistung("").focus());
    $("#btn-new").addEventListener("click", () => {
      if (confirm("Neuen Auftrag starten? Nicht gespeicherte Eingaben gehen verloren.")) newAuftrag();
    });
    $("#btn-save").addEventListener("click", saveCurrent);
    $("#btn-print").addEventListener("click", () => window.print());
    $("#btn-list").addEventListener("click", openList);
    $("#btn-close-list").addEventListener("click", closeList);
    $("#overlay").addEventListener("click", (e) => {
      if (e.target === $("#overlay")) closeList();
    });

    $$('input[name="art"]').forEach((r) => r.addEventListener("change", syncEinheitMitArt));
    ["f-betrag", "f-stunden"].forEach((id) => $("#" + id).addEventListener("input", recomputeGesamt));
    $("#f-betrag-einheit").addEventListener("change", recomputeGesamt);

    $$(".sig-clear").forEach((b) =>
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-clear");
        if (pads[id]) pads[id].clear();
      })
    );

    if (seedErsterAuftrag()) {
      // Erstaufruf: bestätigten Auftrag Nr. 1 gleich anzeigen.
      apply(ersterAuftrag());
    } else {
      newAuftrag();
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
