(function () {
  document.getElementById("mascotSlot").innerHTML = ILL.mascot;
  document.getElementById("cloudBg").innerHTML = ILL.cloud;

  var dateInput = document.getElementById("dateInput");
  dateInput.value = istToday();
  dateInput.addEventListener("change", load);

  function istToday() {
    var d = new Date();
    var ist = new Date(d.getTime() + (5.5 * 60 - d.getTimezoneOffset()) * 60000);
    return ist.toISOString().slice(0, 10);
  }

  var CAT_LABEL = { green: "On track", amber: "Monitor", red: "Evaluate" };

  function load() {
    fetch("/api/doctor/list?date=" + dateInput.value)
        .then(function (r) {
          if (r.status === 401) {
            // If token expired, kick to custom login page
            window.location.href = "/login.html";
            throw new Error("Unauthorized");
          }
          return r.json();
        })
        .then(render)
        .catch(function(e) { console.log(e); });
  }

  function statCard(cls, num, labelEn, labelMr) {
    return '<div class="stat ' + cls + '"><div class="num">' + num + '</div><div class="lbl">' + labelEn + '<br><span class="mr">(' + labelMr + ')</span></div></div>';
  }

  function render(data) {
    var subs = data.submissions || [];
    var counts = { green: 0, amber: 0, red: 0 };
    var concernTally = {};
    var devSum = 0;

    subs.forEach(function (s) {
      counts[s.report.overall] = (counts[s.report.overall] || 0) + 1;
      devSum += s.report.development.pct;
      (s.report.behaviour.concerns || []).forEach(function (c) {
        if (c === "None") return;
        concernTally[c] = (concernTally[c] || 0) + 1;
      });
    });

    document.getElementById("statGrid").innerHTML =
        statCard("total", subs.length, "Total screened", "एकूण तपासणी") +
        statCard("green", counts.green || 0, "Appropriate", "योग्य") +
        statCard("amber", counts.amber || 0, "Monitor", "निरीक्षण") +
        statCard("red", counts.red || 0, "Evaluate", "तपासणी आवश्यक");

    var concernsCard = document.getElementById("concernsCard");
    var tallyKeys = Object.keys(concernTally);
    if (tallyKeys.length) {
      concernsCard.style.display = "block";
      document.getElementById("concernsTally").innerHTML = tallyKeys.map(function (k) {
        return '<div class="kv"><span>' + k + '</span><span>' + concernTally[k] + '</span></div>';
      }).join("");
    } else {
      concernsCard.style.display = "none";
    }

    var list = document.getElementById("subList");
    var empty = document.getElementById("emptyState");
    list.innerHTML = "";
    empty.style.display = subs.length ? "none" : "block";

    subs.forEach(function (s) {
      var row = document.createElement("div");
      row.className = "sub-row";
      var time = new Date(s.submittedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      var badgeCls = s.report.overall;
      row.innerHTML =
          '<div class="sub-row-top">' +
          '<div><div class="name">' + escapeHtml(s.childName) + '</div><div class="meta">' + escapeHtml(s.sex) + ' · ' + s.report.ageLabel + ' · ' + time + '</div></div>' +
          '<span class="badge ' + badgeCls + '">' + (badgeCls === "green" ? "🟢" : badgeCls === "amber" ? "🟡" : "🔴") + '</span>' +
          '</div>' +
          '<div class="sub-detail">' + detailHtml(s) + '</div>';
      row.addEventListener("click", function (e) {
        if (e.target.tagName === "A") return;
        row.classList.toggle("open");
      });
      list.appendChild(row);
    });
  }

  function detailHtml(s) {
    var r = s.report;
    var metList = r.development.items.map(function (it) {
      var checked = s.milestones && s.milestones[it.en];
      return '<div class="kv"><span>' + (checked ? "✅" : "▫️") + ' ' + it.en + '</span><span></span></div>';
    }).join("");
    return (
        '<div class="kv"><span>Parent</span><span>' + escapeHtml(s.parentName) + ' · ' + escapeHtml(s.mobile) + '</span></div>' +
        '<div class="kv"><span>Weight</span><span>' + r.weight.actual + ' kg (exp ~' + (r.weight.expected != null ? r.weight.expected.toFixed(1) : "—") + ') — ' + (CAT_LABEL[r.weight.cat] || "—") + '</span></div>' +
        '<div class="kv"><span>Height</span><span>' + r.height.actual + ' cm (exp ~' + (r.height.expected != null ? r.height.expected.toFixed(1) : "—") + ') — ' + (CAT_LABEL[r.height.cat] || "—") + '</span></div>' +
        '<div class="kv"><span>Head circ.</span><span>' + (r.head != null ? r.head + " cm" : "—") + '</span></div>' +
        '<div class="kv"><span>MUAC</span><span>' + (r.muac != null ? r.muac + " cm" : "—") + '</span></div>' +
        '<div class="kv"><span>Development</span><span>' + r.development.pct + '% (' + r.development.metCount + '/' + r.development.total + ', ' + r.bandLabelEn + ')</span></div>' +
        metList +
        '<div class="kv"><span>Screen time</span><span>' + (r.behaviour.screen || "—") + '</span></div>' +
        '<div class="kv"><span>Sleep</span><span>' + (r.behaviour.sleepHours != null ? r.behaviour.sleepHours + " hrs" : "—") + '</span></div>' +
        '<div class="kv"><span>Concerns</span><span>' + (r.behaviour.concerns.length ? r.behaviour.concerns.join(", ") : "None") + '</span></div>'
    );
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function logout() {
    fetch("/api/logout", { method: "POST" }).then(function() {
      window.location.href = "/login.html";
    });
  }

  // Bind to window to access from HTML onclick
  window.AppDoc = { logout: logout };

  load();
})();