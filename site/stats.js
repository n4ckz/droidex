/* =========================================================================
   Page /stats/ — hydratation client des statistiques officielles de l'île.
   Sources (toutes publiques, CORS ouvert) :
   - archive du dépôt (data/metrics/daily.json via raw.githubusercontent.com),
     alimentée chaque jour par le cron (l'API Epic ne garde que 7 jours) ;
   - Ecosystem API d'Epic : fenêtre 7 jours (day) + quasi-live (minute).
   Sans réseau : la page reste sur les valeurs statiques générées au build.
   Aucune chaîne distante n'entre dans le DOM autrement que par textContent.
   ========================================================================= */
(function () {
  'use strict';
  var ISLAND = '7865-8305-9184';
  var API = 'https://api.fortnite.com/ecosystem/v1/islands/' + ISLAND + '/metrics/';
  var ARCHIVE = 'https://raw.githubusercontent.com/n4ckz/droidex/main/data/metrics/daily.json';
  var SVGNS = 'http://www.w3.org/2000/svg';
  var ACCENT = '#9184d9';   /* --accent Nocturne, validé sur surface #101120 */

  function fmt(n) {
    if (n == null) return '—';
    if (n >= 1e6) { var m = Math.round(n / 1e5) / 10; return (m === Math.round(m) ? Math.round(m) : m) + 'M'; }
    if (n >= 1000) { var k = Math.round(n / 100) / 10; return (k === Math.round(k) ? Math.round(k) : k) + 'K'; }
    return String(Math.round(n));
  }
  function pct(v) { return v == null ? '—' : Math.round(v * 100) + '%'; }
  function monthDay(iso) {  /* '2026-07-14' -> 'Jul 14' (page EN) */
    var m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return m[parseInt(iso.slice(5, 7), 10) - 1] + ' ' + parseInt(iso.slice(8, 10), 10);
  }
  function getJson(url) {
    return fetch(url).then(function (r) { return r.ok ? r.json() : Promise.reject(new Error(r.status)); });
  }
  function setStat(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /* {métrique:[{value,timestamp},…]} → {jour: {métrique: valeur}} */
  function byDay(payload) {
    var rows = {};
    Object.keys(payload).forEach(function (metric) {
      var pts = payload[metric];
      if (!Array.isArray(pts)) return;
      pts.forEach(function (p) {
        var day = (p.timestamp || '').slice(0, 10);
        if (!day) return;
        rows[day] = rows[day] || {};
        if (metric === 'retention') {
          if (p.d1 != null) rows[day].retentionD1 = p.d1;
          if (p.d7 != null) rows[day].retentionD7 = p.d7;
        } else if (p.value != null) rows[day][metric] = p.value;
      });
    });
    return rows;
  }

  /* ---------- graphique en ligne (série unique, un seul axe) ---------- */
  function drawChart(figure, series) {
    var box = figure.querySelector('.chart-box');
    if (!box || series.length < 2) return;
    box.textContent = '';
    var W = 640, H = 220, L = 48, R = 16, T = 14, B = 26;
    var iw = W - L - R, ih = H - T - B;
    var max = 0;
    series.forEach(function (p) { if (p[1] > max) max = p[1]; });
    /* plafond « propre » : 1/2/5 × 10^n au-dessus du max */
    var pow = Math.pow(10, Math.floor(Math.log(max) / Math.LN10));
    var top = [1, 2, 5, 10].map(function (m) { return m * pow; })
      .filter(function (v) { return v >= max; })[0] || max;
    var x = function (i) { return L + (i / (series.length - 1)) * iw; };
    var y = function (v) { return T + ih - (v / top) * ih; };

    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('role', 'img');

    /* grille : 4 paliers, filet 1px discret + graduations en tokens texte */
    [0.25, 0.5, 0.75, 1].forEach(function (f) {
      var gy = y(top * f);
      var line = document.createElementNS(SVGNS, 'line');
      line.setAttribute('x1', L); line.setAttribute('x2', W - R);
      line.setAttribute('y1', gy); line.setAttribute('y2', gy);
      line.setAttribute('class', 'grid');
      svg.appendChild(line);
      var tick = document.createElementNS(SVGNS, 'text');
      tick.setAttribute('x', L - 7); tick.setAttribute('y', gy + 3);
      tick.setAttribute('text-anchor', 'end');
      tick.setAttribute('class', 'tick');
      tick.textContent = fmt(top * f);
      svg.appendChild(tick);
    });
    /* abscisses : premier, dernier, et ~3 intermédiaires */
    var step = Math.max(1, Math.round((series.length - 1) / 4));
    for (var i = 0; i < series.length; i += step) {
      var lx = document.createElementNS(SVGNS, 'text');
      lx.setAttribute('x', x(i)); lx.setAttribute('y', H - 8);
      lx.setAttribute('text-anchor', i === 0 ? 'start' : 'middle');
      lx.setAttribute('class', 'tick');
      lx.textContent = monthDay(series[i][0]);
      svg.appendChild(lx);
    }

    var dLine = '', dArea = '';
    series.forEach(function (p, j) {
      var px = x(j), py = y(p[1]);
      dLine += (j ? 'L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1);
    });
    dArea = dLine + 'L' + (W - R) + ' ' + (T + ih) + 'L' + L + ' ' + (T + ih) + 'Z';

    var area = document.createElementNS(SVGNS, 'path');
    area.setAttribute('d', dArea);
    area.setAttribute('fill', ACCENT); area.setAttribute('fill-opacity', '0.1');
    svg.appendChild(area);
    var path = document.createElementNS(SVGNS, 'path');
    path.setAttribute('d', dLine);
    path.setAttribute('fill', 'none'); path.setAttribute('stroke', ACCENT);
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linejoin', 'round'); path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path);

    /* point final : ≥8px avec anneau 2px couleur surface, valeur en bout */
    var lastI = series.length - 1;
    var dot = document.createElementNS(SVGNS, 'circle');
    dot.setAttribute('cx', x(lastI)); dot.setAttribute('cy', y(series[lastI][1]));
    dot.setAttribute('r', '4'); dot.setAttribute('fill', ACCENT);
    dot.setAttribute('class', 'end-dot');
    svg.appendChild(dot);
    var endLabel = document.createElementNS(SVGNS, 'text');
    endLabel.setAttribute('x', x(lastI)); endLabel.setAttribute('y', y(series[lastI][1]) - 10);
    endLabel.setAttribute('text-anchor', 'end');
    endLabel.setAttribute('class', 'end-label');
    endLabel.textContent = fmt(series[lastI][1]);
    svg.appendChild(endLabel);

    /* survol : réticule + infobulle (cible = tout le tracé) */
    var cross = document.createElementNS(SVGNS, 'line');
    cross.setAttribute('y1', T); cross.setAttribute('y2', T + ih);
    cross.setAttribute('class', 'crosshair'); cross.setAttribute('visibility', 'hidden');
    svg.appendChild(cross);
    var hoverDot = document.createElementNS(SVGNS, 'circle');
    hoverDot.setAttribute('r', '4'); hoverDot.setAttribute('fill', ACCENT);
    hoverDot.setAttribute('class', 'end-dot'); hoverDot.setAttribute('visibility', 'hidden');
    svg.appendChild(hoverDot);
    var tip = document.createElement('div');
    tip.className = 'chart-tip'; tip.hidden = true;
    box.appendChild(tip);

    svg.addEventListener('pointermove', function (ev) {
      var r = svg.getBoundingClientRect();
      var relX = (ev.clientX - r.left) / r.width * W;
      var i = Math.round((relX - L) / iw * (series.length - 1));
      i = Math.max(0, Math.min(series.length - 1, i));
      var px = x(i), py = y(series[i][1]);
      cross.setAttribute('x1', px); cross.setAttribute('x2', px);
      cross.setAttribute('visibility', 'visible');
      hoverDot.setAttribute('cx', px); hoverDot.setAttribute('cy', py);
      hoverDot.setAttribute('visibility', 'visible');
      tip.textContent = monthDay(series[i][0]) + ' — ' + fmt(series[i][1]);
      tip.hidden = false;
      tip.style.left = Math.min(92, Math.max(8, px / W * 100)) + '%';
    });
    svg.addEventListener('pointerleave', function () {
      cross.setAttribute('visibility', 'hidden');
      hoverDot.setAttribute('visibility', 'hidden');
      tip.hidden = true;
    });
    box.appendChild(svg);
  }

  /* ---------- tuiles + tableau ---------- */
  function hydrate(daily) {
    var days = Object.keys(daily).sort();
    if (!days.length) return;
    var last = days[days.length - 1], d = daily[last];
    var prev = days.length > 1 ? daily[days[days.length - 2]] : null;
    setStat('stat-peak', fmt(d.peakCCU));
    setStat('stat-peak-day', monthDay(last));
    if (prev && prev.peakCCU && d.peakCCU != null) {
      var delta = (d.peakCCU - prev.peakCCU) / prev.peakCCU;
      var el = document.getElementById('stat-peak-delta');
      if (el) {
        el.textContent = (delta >= 0 ? '▲ +' : '▼ ') + Math.round(delta * 100) + '% vs previous day';
        el.className = 'stat-delta ' + (delta >= 0 ? 'up' : 'down');
      }
    }
    setStat('stat-unique', fmt(d.uniquePlayers));
    setStat('stat-plays', fmt(d.plays));
    setStat('stat-avgmin', d.averageMinutesPerPlayer == null ? '—' : Math.round(d.averageMinutesPerPlayer) + ' min');
    setStat('stat-d1', pct(d.retentionD1));
    setStat('stat-d7', pct(d.retentionD7));

    /* tableau (du plus récent au plus ancien) */
    var tbody = document.getElementById('stats-tbody');
    if (tbody) {
      tbody.textContent = '';
      days.slice().reverse().forEach(function (day) {
        var v = daily[day], tr = document.createElement('tr');
        [day, fmt(v.peakCCU), fmt(v.uniquePlayers), fmt(v.plays),
         v.averageMinutesPerPlayer == null ? '—' : Math.round(v.averageMinutesPerPlayer),
         pct(v.retentionD1), pct(v.retentionD7)].forEach(function (cell) {
          var td = document.createElement('td');
          td.textContent = cell;
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    }

    var ccu = days.filter(function (k) { return daily[k].peakCCU != null; })
      .map(function (k) { return [k, daily[k].peakCCU]; });
    var plays = days.filter(function (k) { return daily[k].plays != null; })
      .map(function (k) { return [k, daily[k].plays]; });
    drawChart(document.getElementById('chart-ccu'), ccu);
    drawChart(document.getElementById('chart-plays'), plays);
  }

  /* ---------- chargement ---------- */
  var today = new Date().toISOString().slice(0, 10);
  var frm = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10) + 'T00:00:00Z';
  var to = new Date().toISOString().slice(0, 14) + '00:00Z';

  Promise.allSettled([
    getJson(ARCHIVE),
    getJson(API + 'day?from=' + frm + '&to=' + to)
  ]).then(function (res) {
    var daily = res[0].status === 'fulfilled' ? res[0].value : {};
    if (res[1].status === 'fulfilled') {
      var fresh = byDay(res[1].value);
      Object.keys(fresh).forEach(function (day) {
        if (day !== today) daily[day] = fresh[day];  /* le jour en cours est incomplet */
      });
    }
    hydrate(daily);
  });

  /* tuile « en jeu maintenant » : dernier point 10 min non nul, rafraîchi 5 min */
  function refreshLive() {
    getJson(API + 'minute').then(function (d) {
      var pts = (d.peakCCU || []).filter(function (p) { return typeof p.value === 'number'; });
      if (pts.length) setStat('stat-live', fmt(pts[pts.length - 1].value));
    }).catch(function () {});
  }
  refreshLive();
  setInterval(refreshLive, 5 * 60 * 1000);
})();
