(function () {
  document.getElementById("mascotSlot").innerHTML = ILL.mascot;
  document.getElementById("plantIconSlot").innerHTML = ILL.plantGrowth;
  document.getElementById("cloudBg").innerHTML = ILL.cloud;

  var totalSteps = 5;
  var current = 1;
  var STEP_LABELS = [
    { en: "Parent", mr: "पालक" },
    { en: "Child", mr: "बालक" },
    { en: "Growth", mr: "वाढ" },
    { en: "Milestones", mr: "टप्पे" },
    { en: "Behaviour", mr: "वर्तन" }
  ];

  var MILESTONES = [];
  var state = {
    parentName: "", mobile: "", email: "", childName: "",
    sex: "", dob: "", birthWeight: "",
    weight: "", height: "", head: "", muac: "",
    milestones: {}, milestoneBand: "",
    screen: "", sleep: "", concerns: []
  };

  fetch("/data/milestones.json").then(function (r) { return r.json(); }).then(function (data) {
    MILESTONES = data;
    if (current === 4) renderMilestones();
  });

  function ageInMonths(dobStr, atDate) {
    var dob = new Date(dobStr);
    var now = atDate || new Date();
    var months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
    if (now.getDate() < dob.getDate()) months--;
    return Math.max(0, months);
  }
  function formatAge(m) {
    var y = Math.floor(m / 12), rem = m % 12;
    if (y <= 0) return rem + " month" + (rem === 1 ? "" : "s");
    return y + " yr" + (y === 1 ? "" : "s") + (rem ? " " + rem + " mo" : "");
  }
  function pickBand(m) {
    for (var i = 0; i < MILESTONES.length; i++) {
      var b = MILESTONES[i];
      if (m >= b.min && m < b.max) return b;
    }
    return m >= 60 ? MILESTONES[MILESTONES.length - 1] : MILESTONES[0];
  }

  function saveDraft() {
    try { localStorage.setItem("balrog_draft", JSON.stringify({ state: state, current: current })); } catch (e) {}
  }
  function loadDraft() {
    try {
      var raw = localStorage.getItem("balrog_draft");
      if (!raw) return;
      var d = JSON.parse(raw);
      if (d && d.state) { state = Object.assign(state, d.state); current = d.current || 1; }
    } catch (e) {}
  }
  function clearDraft() { try { localStorage.removeItem("balrog_draft"); } catch (e) {} }

  function renderRail() {
    var rail = document.getElementById("rail");
    rail.innerHTML = "";
    for (var i = 1; i <= totalSteps; i++) {
      var d = document.createElement("div");
      d.className = "dot" + (i < current ? " done" : "") + (i === current ? " current" : "");
      d.innerHTML = '<div class="pill"></div><div class="lbl">' + STEP_LABELS[i - 1].en + '</div>';
      rail.appendChild(d);
    }
  }

  function showStep(n) {
    document.querySelectorAll(".step").forEach(function (s) {
      s.classList.toggle("active", parseInt(s.dataset.step, 10) === n);
    });
    document.getElementById("backBtn").style.visibility = n === 1 ? "hidden" : "visible";

    document.getElementById("nextBtn").innerHTML = n === totalSteps
        ? 'Generate report<br><span class="mr" style="font-size:13px; font-weight:500;">(अहवाल तयार करा)</span>'
        : 'Next<br><span class="mr" style="font-size:13px; font-weight:500;">(पुढे)</span>';

    renderRail();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearErrors() { document.querySelectorAll(".err").forEach(function (e) { e.style.display = "none"; }); }
  function showErr(id) { var e = document.getElementById("err-" + id); if (e) e.style.display = "block"; }

  document.getElementById("sexChoice").addEventListener("click", function (e) {
    var c = e.target.closest(".choice"); if (!c) return;
    Array.from(this.children).forEach(function (ch) { ch.classList.remove("selected"); });
    c.classList.add("selected"); state.sex = c.dataset.val;
  });
  document.getElementById("screenChoice").addEventListener("click", function (e) {
    var c = e.target.closest(".choice"); if (!c) return;
    Array.from(this.children).forEach(function (ch) { ch.classList.remove("selected"); });
    c.classList.add("selected"); state.screen = c.dataset.val;
  });
  document.getElementById("dob").addEventListener("change", function () {
    state.dob = this.value;
    var out = document.getElementById("ageOut");
    if (state.dob) {
      var m = ageInMonths(state.dob);
      out.innerHTML = "Current age: " + formatAge(m) + " <span class=\"mr\">(सध्याचे वय)</span>";
    } else {
      out.innerHTML = "Age is calculated automatically. <span class=\"mr\">(वय आपोआप मोजले जाईल.)</span>";
    }
  });

  function renderMilestones() {
    if (!MILESTONES.length) return;
    var m = state.dob ? ageInMonths(state.dob) : 0;
    var band = pickBand(m);
    state.milestoneBand = band.key;
    document.getElementById("bandNote").innerHTML =
        "Showing milestones for <b>" + band.label_en + "</b> (" + formatAge(m) + ").<br><span class=\"mr\">(" + band.label_mr + " साठीचे विकास टप्पे दाखवले आहेत.)</span>";
    var list = document.getElementById("milestoneList");
    list.innerHTML = "";
    band.items.forEach(function (it) {
      var row = document.createElement("label");
      row.className = "milestone";
      var checked = state.milestones[it.en] ? "checked" : "";
      row.innerHTML = '<input type="checkbox" value="' + it.en + '" ' + checked + '><span><span class="m-en">' + it.en + '</span><span class="m-mr">(' + it.mr + ')</span></span>';
      list.appendChild(row);
    });
  }

  function collectStep(n) {
    if (n === 1) {
      state.parentName = document.getElementById("parentName").value.trim();
      state.mobile = document.getElementById("mobile").value.trim();
      state.email = document.getElementById("email").value.trim();
      state.childName = document.getElementById("childName").value.trim();
    } else if (n === 2) {
      state.dob = document.getElementById("dob").value;
      state.birthWeight = document.getElementById("birthWeight").value;
    } else if (n === 3) {
      state.weight = document.getElementById("weight").value;
      state.height = document.getElementById("height").value;
      state.head = document.getElementById("head").value;
      state.muac = document.getElementById("muac").value;
    } else if (n === 4) {
      var boxes = document.querySelectorAll("#milestoneList input[type=checkbox]");
      var m = {};
      boxes.forEach(function (b) { m[b.value] = b.checked; });
      state.milestones = m;
    } else if (n === 5) {
      state.sleep = document.getElementById("sleep").value;
      state.concerns = Array.from(document.querySelectorAll("#concernsList input:checked")).map(function (c) { return c.value; });
    }
  }

  function validateStep(n) {
    clearErrors();
    var ok = true;
    if (n === 1) {
      if (!state.parentName) { showErr("parentName"); ok = false; }
      if (!/^\d{10}$/.test(state.mobile)) { showErr("mobile"); ok = false; }
      if (!/^\S+@\S+\.\S+$/.test(state.email)) { showErr("email"); ok = false; }
      if (!state.childName) { showErr("childName"); ok = false; }
    } else if (n === 2) {
      if (!state.sex) { showErr("sex"); ok = false; }
      if (!state.dob) { showErr("dob"); ok = false; }
      else { var m = ageInMonths(state.dob); if (m < 0 || m > 72) { showErr("dob"); ok = false; } }
    } else if (n === 3) {
      if (!state.weight) { showErr("weight"); ok = false; }
      if (!state.height) { showErr("height"); ok = false; }
    } else if (n === 5) {
      if (state.sleep === "") { showErr("sleep"); ok = false; }
    }
    return ok;
  }

  function nextStep() {
    collectStep(current);
    if (!validateStep(current)) return;
    saveDraft();
    if (current === totalSteps) { submitForm(); return; }
    current++;
    if (current === 4) renderMilestones();
    showStep(current);
  }
  function prevStep() {
    collectStep(current);
    if (current > 1) { current--; showStep(current); if (current === 4) renderMilestones(); }
  }

  function submitForm() {
    collectStep(5);
    saveDraft();
    var btn = document.getElementById("nextBtn");
    btn.disabled = true;
    btn.innerHTML = 'Submitting…<br><span class="mr" style="font-size:13px; font-weight:500;">(पाठवत आहे…)</span>';

    fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state)
    }).then(function (r) {
      if(!r.ok) { return r.json().then(function(e) { throw new Error(e.error || "Server issue"); }); }
      return r.json();
    }).then(function (data) {
      if (data.error) {
        alert(data.error);
        btn.disabled = false;
        btn.innerHTML = 'Generate report<br><span class="mr" style="font-size:13px; font-weight:500;">(अहवाल तयार करा)</span>';
        return;
      }
      renderReport(data);
      clearDraft();
    }).catch(function (err) {
      console.error(err);
      alert("Network Error: Could not submit.\n\nPlease make sure you are running the backend server (Node.js) and not just opening the HTML file directly in your browser.\n\nTechnical detail: " + err.message);
      btn.disabled = false;
      btn.innerHTML = 'Generate report<br><span class="mr" style="font-size:13px; font-weight:500;">(अहवाल तयार करा)</span>';
    });
  }

  var adviceMap = {
    green: { en: "Growth appears appropriate for age. Continue healthy diet & monitoring.", mr: "वाढ वयानुसार योग्य दिसत आहे. सकस आहार व निरीक्षण सुरू ठेवा." },
    amber: { en: "Recheck growth in 1–3 months and discuss nutrition.", mr: "१-३ महिन्यांनी पुन्हा तपासणी करा आणि आहाराबाबत चर्चा करा." },
    red: { en: "Please consult a pediatrician / Kaumarbhritya specialist for assessment.", mr: "कृपया मूल्यांकनासाठी बालरोगतज्ञ किंवा कौमारभृत्य तज्ञांचा सल्ला घ्या." }
  };
  var badgeMap = {
    green: { emoji: "🟢", en: "Appropriate", mr: "योग्य" },
    amber: { emoji: "🟡", en: "Needs monitoring", mr: "निरीक्षण आवश्यक" },
    red: { emoji: "🔴", en: "Needs evaluation", mr: "तपासणी आवश्यक" }
  };
  var screenLabels = { lt1: "< 1 hr", "1-2": "1–2 hrs", "2-4": "2–4 hrs", gt4: "> 4 hrs" };

  function barBlock(labelEn, labelMr, actual, expected, unit, cat) {
    var wrap = document.createElement("div");
    wrap.className = "barblock";
    var maxVal = Math.max(actual || 0, expected || 0) * 1.15 || 1;
    var actPct = Math.min(100, ((actual || 0) / maxVal) * 100);
    var expPct = expected != null ? Math.min(100, (expected / maxVal) * 100) : null;
    var catLabel = cat ? (cat === "green" ? "On track (व्यवस्थित)" : cat === "amber" ? "Monitor (निरीक्षण करा)" : "Evaluate (तपासणी करा)") : "No reference for this age (या वयासाठी संदर्भ नाही)";
    wrap.innerHTML =
        '<div class="barlabel"><span>' + labelEn + ' <span class="mr">(' + labelMr + ')</span></span><span>' + actual + ' ' + unit + (expected != null ? ' (exp. ~' + expected.toFixed(1) + ' ' + unit + ')' : '') + '</span></div>' +
        '<div class="bar-pair"><div class="bartrack"><div class="barfill" style="width:' + actPct + '%"></div></div>' +
        (expPct != null ? '<div class="bartrack"><div class="barfill expected" style="width:' + expPct + '%"></div></div>' : '') + '</div>' +
        '<div class="hint">' + catLabel + '</div>';
    return wrap;
  }

  function renderReport(data) {
    var report = data.report;
    var overall = report.overall;
    var b = badgeMap[overall];

    document.getElementById("repBadge").innerHTML =
        '<div class="badge ' + overall + '">' + b.emoji + ' ' + b.en + ' <span class="mr">(' + b.mr + ')</span></div>';

    document.getElementById("rChildName").textContent = data.childName;
    document.getElementById("rSex").textContent = data.sex;
    document.getElementById("rDob").textContent = data.dob;
    document.getElementById("rAge").textContent = report.ageLabel;
    document.getElementById("rParent").textContent = (data.parentName || "") + (data.mobile ? " · " + data.mobile : "");

    var gb = document.getElementById("growthBars");
    gb.innerHTML = "";
    gb.appendChild(barBlock("Weight", "वजन", report.weight.actual, report.weight.expected, "kg", report.weight.cat));
    gb.appendChild(barBlock("Height", "उंची", report.height.actual, report.height.expected, "cm", report.height.cat));
    if (report.head) gb.appendChild(barBlock("Head circumference", "डोक्याचा घेर", report.head, null, "cm", null));
    if (report.muac) gb.appendChild(barBlock("MUAC", "दंडाचा घेर", report.muac, null, "cm", null));

    var circumference = 2 * Math.PI * 37;
    var arc = document.getElementById("gaugeArc");
    arc.style.strokeDasharray = circumference;
    arc.style.strokeDashoffset = circumference - (report.development.pct / 100) * circumference;
    arc.style.stroke = report.development.cat === "green" ? "var(--green)" : report.development.cat === "amber" ? "var(--amber)" : "var(--red)";
    document.getElementById("devScoreNum").textContent = report.development.pct + "%";
    document.getElementById("devScoreSub").innerHTML = report.development.metCount + " of " + report.development.total + " milestones<br><span class=\"mr\">(" + report.bandLabelMr + " साठी)</span>";

    document.getElementById("rScreen").textContent = screenLabels[report.behaviour.screen] || "—";
    document.getElementById("rSleep").textContent = (report.behaviour.sleepHours != null ? report.behaviour.sleepHours : "—") + " hrs/day";
    document.getElementById("rConcerns").textContent = report.behaviour.concerns.length ? report.behaviour.concerns.join(", ") : "None reported (काहीही नाही)";

    var adv = adviceMap[overall];
    var abox = document.getElementById("adviceBox");
    abox.className = "advice-box " + overall;
    abox.innerHTML = adv.en + '<br><span class="mr">(' + adv.mr + ')</span>';

    document.getElementById("formArea").style.display = "none";
    document.getElementById("report").style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.getElementById("downloadBtn").addEventListener("click", function () {
    var btn = this;
    var original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Preparing…<br><span class="mr" style="font-size:13px; font-weight:500;">(तयार करत आहे…)</span>';
    var target = document.getElementById("reportInner");
    html2canvas(target, { scale: 2, backgroundColor: "#F5FBFA", useCORS: true }).then(function (canvas) {
      var imgData = canvas.toDataURL("image/jpeg", 0.95);
      var jsPDF = window.jspdf.jsPDF;
      var pdf = new jsPDF({ unit: "pt", format: "a4" });
      var pageWidth = pdf.internal.pageSize.getWidth();
      var pageHeight = pdf.internal.pageSize.getHeight();
      var imgWidth = pageWidth;
      var imgHeight = (canvas.height * imgWidth) / canvas.width;
      var heightLeft = imgHeight;
      var position = 0;
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      var fname = "Balrog-Screening-" + (document.getElementById("rChildName").textContent || "report").replace(/\s+/g, "_") + ".pdf";
      pdf.save(fname);
      btn.disabled = false;
      btn.innerHTML = original;
    }).catch(function () {
      btn.disabled = false;
      btn.innerHTML = original;
      window.print();
    });
  });

  function restart() { clearDraft(); location.reload(); }

  loadDraft();
  if (state.parentName) document.getElementById("parentName").value = state.parentName;
  if (state.mobile) document.getElementById("mobile").value = state.mobile;
  if (state.email) document.getElementById("email").value = state.email;
  if (state.childName) document.getElementById("childName").value = state.childName;
  if (state.dob) { document.getElementById("dob").value = state.dob; document.getElementById("dob").dispatchEvent(new Event("change")); }
  if (state.birthWeight) document.getElementById("birthWeight").value = state.birthWeight;
  if (state.weight) document.getElementById("weight").value = state.weight;
  if (state.height) document.getElementById("height").value = state.height;
  if (state.head) document.getElementById("head").value = state.head;
  if (state.muac) document.getElementById("muac").value = state.muac;
  if (state.sleep) document.getElementById("sleep").value = state.sleep;
  if (state.sex) document.querySelectorAll("#sexChoice .choice").forEach(function (c) { if (c.dataset.val === state.sex) c.classList.add("selected"); });
  if (state.screen) document.querySelectorAll("#screenChoice .choice").forEach(function (c) { if (c.dataset.val === state.screen) c.classList.add("selected"); });
  if (state.concerns && state.concerns.length) document.querySelectorAll("#concernsList input").forEach(function (c) { if (state.concerns.indexOf(c.value) > -1) c.checked = true; });
  showStep(current);

  document.addEventListener("input", function () { collectStep(current); saveDraft(); });
  window.AppForm = { nextStep: nextStep, prevStep: prevStep, restart: restart };
})();