/*
 * Robô Virtual — Tapete de Missões
 * Feito por Pedro Lima, Orientador Educacional (ZOOM Education for Life).
 * Simulador, execução dos blocos e interface. Escala: 1 quadrante = 10 cm.
 */
(function () {
  'use strict';
  var A = window.ROBO_ARQUIVOS; // imagens embutidas (tapete, robô, logo)

  /* Tapetes: ax/ay = centro do quadrante A1 (canto de baixo, à esquerda) na imagem; ppcX/ppcY = pixels por cm;
     cel = lado do quadrante em cm; inv = a numeração das linhas começa no topo; est = atalhos de chegada [rótulo, quadrante, nome]. */
  var TAPETES = [
    { id: 'vincibot', nome: 'Tapete VinciBot', img: A.tapete, w: 1255, h: 784, ax: 100, ay: 708, ppcX: 10.54, ppcY: 10.48, cols: 10, rows: 7, cel: 10, inv: false,
      est: [['1', 'B3', 'número 1'], ['2', 'E7', 'número 2'], ['3', 'E1', 'número 3'], ['4', 'I5', 'número 4'], ['5', 'C5', 'número 5']] },
    { id: 'matata', nome: 'Tapete Matata', img: A.tapeteMatata, w: 665, h: 767, ax: 72, ay: 616, ppcX: 10.58, ppcY: 10.96, cols: 6, rows: 6, cel: 10, inv: false,
      est: [['▲', 'A1', 'triângulo'], ['●', 'F1', 'círculo'], ['★', 'F6', 'estrela'], ['■', 'A6', 'quadrado']] },
    { id: 'tale', nome: 'Tapete Tale', img: A.tapeteTale, w: 1000, h: 689, ax: 211.8, ay: 606.9, ppcX: 14.00, ppcY: 11.93, cols: 6, rows: 5, cel: 10, inv: true, est: [] },
    { id: 'nous', nome: 'Tapete Nous', img: A.tapeteNous, w: 689, h: 483, ax: 88, ay: 395.5, ppcX: 4.28, ppcY: 4.3, cols: 7, rows: 4, cel: 20, inv: false, est: [] }
  ];
  var MAT = {}, CEL = 10, LINV = false, ESTACOES = [], TAPETE = null;
  var COLS = 'ABCDEFGHIJ';
  var VEL_LINEAR = 10, VEL_GIRO = 90, BITOLA = 8, TAM_ROBO = 8.6, TAM_OBST = 9;
  var NIVEIS = [
    { nome: 'Fácil', qtd: 4, curvas: 1, max: 2 }, { nome: 'Médio', qtd: 8, curvas: 2, max: 4 },
    { nome: 'Difícil', qtd: 14, curvas: 4, max: 6 }, { nome: 'Ultra difícil', qtd: 20, curvas: 6, max: 99 }
  ];
  var CORES_PROIBIVEIS = ['', 'red', 'blue', 'green', 'yellow', 'purple', 'black'];
  var NOMES_COR = { white: 'branco', black: 'preto', grey: 'cinza', red: 'vermelho', yellow: 'amarelo', green: 'verde', blue: 'azul', purple: 'roxo', unknown: '—' };
  // Cada robô tem o seu tapete. Para acrescentar outro: { id, nome, img, tam (cm), tapete (id em TAPETES) }
  var ROBOS = [
    { id: 'vincibot', nome: 'VinciBot', img: A.robo, tam: 8.6, tapete: 'vincibot' },
    { id: 'matata', nome: 'Matata', img: A.roboMatata, tam: 8.6, tapete: 'matata' },
    { id: 'nous', nome: 'Nous', img: A.roboNous, tam: 16, tapete: 'nous' },
    { id: 'tale', nome: 'Tale', img: A.roboTale, tam: 9, tapete: 'tale' }
  ];

  var LS = 'robovirtual.';
  function carregar(k, padrao) { try { var v = localStorage.getItem(LS + k); return v === null ? padrao : JSON.parse(v); } catch (e) { return padrao; } }
  function salvar(k, v) { try { localStorage.setItem(LS + k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } }

  var cfg = {
    aberto: carregar('aberto', window.innerWidth >= 760 && window.innerHeight >= 520), inicio: carregar('inicio', { col: 0, row: 0, dir: 0 }), etapas: carregar('etapas', []),
    obst: carregar('obst', []), proibida: carregar('proibida', ''), nivel: carregar('nivel', 0), largura: carregar('largura', 480),
    rastro: carregar('rastro', true), turbo: carregar('turbo', 1), som: carregar('som', true), robo: carregar('robo', 'laranja')
  };
  if (!Array.isArray(cfg.obst)) cfg.obst = []; if (!Array.isArray(cfg.etapas)) cfg.etapas = [];
  function salvarMapa() { salvar('inicio', cfg.inicio); salvar('etapas', cfg.etapas); salvar('obst', cfg.obst); salvar('proibida', cfg.proibida); }

  var robo = { x: 0, y: 0, dir: 0, led: null, balanco: 0 };
  var tela = { px: new Float32Array(128), rolagem: null };
  var som = { tempo: 60 };
  var movimento = null, rastro = [];
  var jogo = { etapa: 0, ok: false, batidas: 0, pisadas: 0, tempo: 0, sobreProibida: false };
  var exec = { rodando: false, ficha: null, pilhas: [], crono: 0, esperas: [] };
  var ui = {}, ws = null;
  var imgTapete = new Image(), imgRobo = new Image(), amostra = null, corCelula = null;

  /* ---------- Utilidades ---------- */
  function chave(c, r) { return c + ',' + r; }
  function dentro(c, r) { return c >= 0 && c < MAT.cols && r >= 0 && r < MAT.rows; }
  function celulaDe(x, y) { var c = Math.round(x / CEL), r = Math.round(y / CEL); return dentro(c, r) ? { col: c, row: r, nome: nomeCel({ col: c, row: r }) } : null; }
  function nomeCel(o) { return COLS[o.col] + (LINV ? MAT.rows - o.row : o.row + 1); }
  function parseCelula(nome) { var n = parseInt(nome.slice(1), 10); return { col: COLS.indexOf(nome[0]), row: LINV ? MAT.rows - n : n - 1 }; }
  function nomeDir(d) { d = ((d % 360) + 360) % 360; return ['Norte', 'Nordeste', 'Leste', 'Sudeste', 'Sul', 'Sudoeste', 'Oeste', 'Noroeste'][Math.round(d / 45) % 8]; }
  function limpar(v) { return Math.abs(v - Math.round(v)) < 1e-6 ? Math.round(v) : v; }
  function numero(v, padrao) { var n = parseFloat(v); return isFinite(n) ? n : (padrao || 0); }

  // classificação de cor por matiz/saturação/brilho (escala 0–180 / 0–255 / 0–255)
  function classificarCor(e) {
    var mx = Math.max(e[0], e[1], e[2]), mn = Math.min(e[0], e[1], e[2]), c = mx - mn, h = 0;
    if (c > 0) { if (mx === e[0]) h = ((e[1] - e[2]) / c) * 60; else if (mx === e[1]) h = ((e[2] - e[0]) / c) * 60 + 120; else h = ((e[0] - e[1]) / c) * 60 + 240; if (h < 0) h += 360; }
    h = Math.round(h / 2); var sat = mx === 0 ? 0 : Math.round(255 * c / mx), v = mx;
    if (v < 46) return 'black';
    if (sat < 43) return v > 220 ? 'white' : 'grey';
    if (h <= 10 || h >= 156) return 'red';
    if (h <= 34) return 'yellow';
    if (h <= 88) return 'green';
    if (h <= 124) return 'blue';
    if (h <= 155) return 'purple';
    return 'unknown';
  }
  function corSob(x, y) {
    if (!amostra) return [255, 255, 255];
    var px = Math.round(MAT.ax + x * MAT.ppcX), py = Math.round(MAT.ay - y * MAT.ppcY);
    if (px < 3 || py < 3 || px > MAT.w - 4 || py > MAT.h - 4) return [255, 255, 255];
    var d = amostra.getImageData(px - 2, py - 2, 5, 5).data, s = [0, 0, 0];
    for (var i = 0; i < d.length; i += 4) { s[0] += d[i]; s[1] += d[i + 1]; s[2] += d[i + 2]; }
    return [Math.round(s[0] / 25), Math.round(s[1] / 25), Math.round(s[2] / 25)];
  }
  function celulaProibida(c, r) { return !!(cfg.proibida && corCelula && corCelula[c][r] === cfg.proibida); }

  function distanciaFrente() {
    var rad = robo.dir * Math.PI / 180, dx = Math.sin(rad), dy = Math.cos(rad), best = 400;
    function caixa(x0, x1, y0, y1) {
      var t0 = -Infinity, t1 = Infinity, a, b;
      if (Math.abs(dx) < 1e-9) { if (robo.x < x0 || robo.x > x1) return Infinity; }
      else { a = (x0 - robo.x) / dx; b = (x1 - robo.x) / dx; t0 = Math.max(t0, Math.min(a, b)); t1 = Math.min(t1, Math.max(a, b)); }
      if (Math.abs(dy) < 1e-9) { if (robo.y < y0 || robo.y > y1) return Infinity; }
      else { a = (y0 - robo.y) / dy; b = (y1 - robo.y) / dy; t0 = Math.max(t0, Math.min(a, b)); t1 = Math.min(t1, Math.max(a, b)); }
      return (t1 >= t0 && t1 > 0) ? Math.max(t0, 0) : Infinity;
    }
    var minX = -CEL / 2, maxX = MAT.cols * CEL - CEL / 2, minY = -CEL / 2, maxY = MAT.rows * CEL - CEL / 2;
    if (dx > 1e-9) best = Math.min(best, (maxX - robo.x) / dx);
    if (dx < -1e-9) best = Math.min(best, (minX - robo.x) / dx);
    if (dy > 1e-9) best = Math.min(best, (maxY - robo.y) / dy);
    if (dy < -1e-9) best = Math.min(best, (minY - robo.y) / dy);
    var h = TAM_OBST / 2;
    cfg.obst.forEach(function (k) { var p = k.split(','), cx = p[0] * CEL, cy = p[1] * CEL; best = Math.min(best, caixa(cx - h, cx + h, cy - h, cy + h)); });
    return Math.round(Math.max(0, best - TAM_ROBO / 2) * 10) / 10;
  }

  /* ---------- Física ---------- */
  function bateObst(x, y) {
    var lim = TAM_OBST / 2 + TAM_ROBO / 2 - 0.2;
    for (var i = 0; i < cfg.obst.length; i++) { var p = cfg.obst[i].split(','); if (Math.abs(x - p[0] * CEL) < lim && Math.abs(y - p[1] * CEL) < lim) return true; }
    return false;
  }
  function limitar() {
    var m = TAM_ROBO / 2, bateu = false, minX = -CEL / 2 + m, maxX = MAT.cols * CEL - CEL / 2 - m, minY = -CEL / 2 + m, maxY = MAT.rows * CEL - CEL / 2 - m;
    if (robo.x < minX) { robo.x = minX; bateu = true; } if (robo.x > maxX) { robo.x = maxX; bateu = true; }
    if (robo.y < minY) { robo.y = minY; bateu = true; } if (robo.y > maxY) { robo.y = maxY; bateu = true; }
    return bateu;
  }
  function batida(t) { if (exec.rodando) jogo.batidas++; aviso(t); nota(110, 0.16, 'sawtooth'); }
  function terminar(m) {
    if (movimento === m) movimento = null;
    robo.x = limpar(robo.x); robo.y = limpar(robo.y); robo.dir = limpar(robo.dir);
    if (m && m.fim) { var f = m.fim; m.fim = null; f(); }
  }
  function iniciar(m) {
    if (movimento) { var ant = movimento; movimento = null; if (ant.fim) { var f = ant.fim; ant.fim = null; f(); } }
    movimento = m;
    return new Promise(function (ok) { m.fim = ok; if ((m.tipo === 'linear' || m.tipo === 'giro') && Math.abs(m.resta) < 1e-9) terminar(m); });
  }
  function pararMovimento() { if (movimento) { var m = movimento; movimento = null; robo.balanco = 0; if (m.fim) { var f = m.fim; m.fim = null; f(); } } }
  function passo(dt) {
    dt *= cfg.turbo;
    if (exec.rodando) { exec.crono += dt; if (!jogo.ok) jogo.tempo += dt; }
    for (var i = exec.esperas.length - 1; i >= 0; i--) { var e = exec.esperas[i]; e.resta -= dt; if (e.resta <= 0) { exec.esperas.splice(i, 1); e.ok(); } }
    var m = movimento;
    if (m) {
      var rad = robo.dir * Math.PI / 180, ax = robo.x, ay = robo.y;
      if (m.tipo === 'linear') {
        var d = Math.min(Math.abs(m.resta), m.vel * dt), s = m.resta < 0 ? -1 : 1;
        robo.x += Math.sin(rad) * d * s; robo.y += Math.cos(rad) * d * s; m.resta -= d * s;
        if (bateObst(robo.x, robo.y)) { robo.x = ax; robo.y = ay; m.resta = 0; batida('💥 O robô bateu em um obstáculo.'); }
        else if (limitar()) { m.resta = 0; batida('O robô chegou na borda do tapete.'); }
        if (Math.abs(m.resta) < 1e-9) terminar(m);
      } else if (m.tipo === 'giro') {
        var g = Math.min(Math.abs(m.resta), m.vel * dt), sg = m.resta < 0 ? -1 : 1;
        robo.dir += g * sg; m.resta -= g * sg;
        if (Math.abs(m.resta) < 1e-9) { robo.dir = ((robo.dir % 360) + 360) % 360; terminar(m); }
      } else if (m.tipo === 'continuo') {
        var v = (m.vl + m.vr) / 2, w = (m.vl - m.vr) / BITOLA;
        robo.dir += w * dt * 180 / Math.PI; rad = robo.dir * Math.PI / 180;
        robo.x += Math.sin(rad) * v * dt; robo.y += Math.cos(rad) * v * dt;
        if (bateObst(robo.x, robo.y)) { robo.x = ax; robo.y = ay; if (!m.bateu) { m.bateu = true; batida('💥 O robô bateu em um obstáculo.'); } } else m.bateu = false;
        limitar();
      }
      var u = rastro[rastro.length - 1];
      if (!u || Math.abs(u[0] - robo.x) + Math.abs(u[1] - robo.y) > 0.4) { rastro.push([robo.x, robo.y]); if (rastro.length > 4000) rastro.shift(); }
    }
    verificarJogo(); passoTela(dt); dispararEventos();
  }

  /* ---------- Som ---------- */
  var ac = null, master = null, vozes = [];
  function audio() {
    if (!cfg.som) return null;
    if (!ac) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; try { ac = new C(); } catch (e) { return null; } master = ac.createGain(); master.gain.value = 0.4; master.connect(ac.destination); }
    if (ac.state === 'suspended') { try { ac.resume(); } catch (e) { /* aguarda gesto */ } }
    return ac;
  }
  function nota(freq, dur, tipo, atraso) {
    var a = audio(); if (!a) return;
    var o = a.createOscillator(), g = a.createGain(), t = a.currentTime + (atraso || 0);
    o.type = tipo || 'triangle'; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.9, t + 0.015);
    g.gain.setValueAtTime(0.9, t + Math.max(0.02, dur - 0.05)); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02); vozes.push(o);
    o.onended = function () { var i = vozes.indexOf(o); if (i >= 0) vozes.splice(i, 1); };
  }
  function freqMidi(n) { return n > 127 ? n : 440 * Math.pow(2, (n - 69) / 12); }
  function silenciar() {
    vozes.slice().forEach(function (v) { try { v.stop(); } catch (e) { /* já parou */ } }); vozes = [];
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) { /* sem voz */ }
  }
  function tocarVitoria() { [72, 76, 79, 84].forEach(function (n, i) { nota(freqMidi(n), 0.16, 'triangle', i * 0.13); }); }

  /* ---------- Telinha do rosto (16 x 8) ---------- */
  function figura(l) { var a = new Float32Array(128); for (var y = 0; y < 8; y++) for (var x = 0; x < 16; x++) a[y * 16 + x] = l[y][x] === '#' ? 1 : 0; return a; }
  var IMAGENS = {
    olhos: figura(['................', '................', '...###....###...', '..#####..#####..', '..#...#..#...#..', '................', '................', '................']),
    feliz: figura(['................', '...##......##...', '..####....####..', '................', '...#........#...', '....#......#....', '.....######.....', '................']),
    triste: figura(['................', '...##......##...', '...##......##...', '................', '.....######.....', '....#......#....', '...#........#...', '................']),
    surpreso: figura(['...##......##...', '..#..#....#..#..', '..#..#....#..#..', '...##......##...', '.......##.......', '......#..#......', '.......##.......', '................']),
    coracao: figura(['................', '....##...##.....', '...####.####....', '...#########....', '....#######.....', '.....#####......', '......###.......', '.......#........']),
    certo: figura(['................', '............##..', '...........##...', '..........##....', '...##....##.....', '....##..##......', '.....####.......', '......##........']),
    errado: figura(['................', '....##....##....', '.....##..##.....', '......####......', '......####......', '.....##..##.....', '....##....##....', '................']),
    seta: figura(['.......##.......', '......####......', '.....######.....', '....########....', '.......##.......', '.......##.......', '.......##.......', '.......##.......'])
  };
  function mostrarFigura(a) { tela.rolagem = null; tela.px.set(a); }
  function mostrarTexto(texto) {
    var c = document.createElement('canvas'); c.height = 8; c.width = 16;
    var g = c.getContext('2d'); g.font = 'bold 9px monospace';
    var larg = Math.max(1, Math.ceil(g.measureText(texto).width)) + 1;
    c.width = larg; g = c.getContext('2d', { willReadFrequently: true }); g.font = 'bold 9px monospace'; g.textBaseline = 'top'; g.fillStyle = '#fff';
    g.fillText(texto, 0, -1);
    var d = g.getImageData(0, 0, larg, 8).data, cols = [];
    for (var x = 0; x < larg; x++) { var col = []; for (var y = 0; y < 8; y++) col.push(d[(y * larg + x) * 4 + 3] > 90 ? 1 : 0); cols.push(col); }
    if (larg <= 16) { tela.rolagem = null; tela.px.fill(0); cols.forEach(function (cl, x2) { for (var y2 = 0; y2 < 8; y2++) tela.px[y2 * 16 + x2] = cl[y2]; }); }
    else tela.rolagem = { cols: cols, pos: -16 };
  }
  function passoTela(dt) {
    var r = tela.rolagem; if (!r) return;
    r.pos += dt * 14; var base = Math.floor(r.pos);
    for (var x = 0; x < 16; x++) { var col = r.cols[base + x]; for (var y = 0; y < 8; y++) tela.px[y * 16 + x] = col ? col[y] : 0; }
    if (base > r.cols.length) tela.rolagem = null;
  }

  /* ---------- Comandos que os blocos chamam ---------- */
  var PARAR = { parar: true };
  function vivo(ficha) { if (!ficha || ficha.cancelada) throw PARAR; }
  function esperarSeg(seg) { return new Promise(function (ok) { if (!(seg > 0)) { ok(); return; } exec.esperas.push({ resta: seg, ok: ok }); }); }
  var proximoQuadro = [];
  var R = {
    mover: function (dir, valor, un) {
      valor = numero(valor); if (un === 'inch') valor *= 2.54; else if (un === 'seconds') valor *= VEL_LINEAR;
      return iniciar({ tipo: 'linear', resta: dir === 'backward' ? -valor : valor, vel: VEL_LINEAR });
    },
    girar: function (dir, valor, un) {
      valor = numero(valor); if (un === 'rotations') valor *= 360; else if (un === 'seconds') valor *= VEL_GIRO;
      return iniciar({ tipo: 'giro', resta: dir === 'left' ? -valor : valor, vel: VEL_GIRO });
    },
    moverVel: function (dir, valor, un, vel) {
      valor = numero(valor); if (un === 'inch') valor *= 2.54;
      return iniciar({ tipo: 'linear', resta: dir === 'backward' ? -valor : valor, vel: Math.max(1, Math.abs(numero(vel, 100))) / 100 * VEL_LINEAR });
    },
    girarVel: function (dir, valor, un, vel) {
      valor = numero(valor); if (un === 'rotations') valor *= 360;
      return iniciar({ tipo: 'giro', resta: dir === 'left' ? -valor : valor, vel: Math.max(1, Math.abs(numero(vel, 100))) / 100 * VEL_GIRO });
    },
    iniciarMover: function (dir, vel) {
      var v = numero(vel, 100) / 100 * VEL_LINEAR, g = numero(vel, 100) / 100 * VEL_GIRO * Math.PI / 180 * BITOLA / 2;
      if (dir === 'forward') iniciar({ tipo: 'continuo', vl: v, vr: v }); else if (dir === 'backward') iniciar({ tipo: 'continuo', vl: -v, vr: -v });
      else if (dir === 'left') iniciar({ tipo: 'continuo', vl: -g, vr: g }); else iniciar({ tipo: 'continuo', vl: g, vr: -g });
    },
    pararMover: pararMovimento,
    esperar: function (seg) { return esperarSeg(numero(seg)); },
    imagem: function (nome, seg) { mostrarFigura(IMAGENS[nome] || IMAGENS.olhos); if (seg !== undefined) return esperarSeg(numero(seg)).then(function () { tela.px.fill(0); }); return undefined; },
    texto: function (t) { mostrarTexto(String(t)); },
    pixel: function (x, y, b) { x = Math.round(numero(x)); y = Math.round(numero(y)); if (x >= 0 && x < 16 && y >= 0 && y < 8) { tela.rolagem = null; tela.px[y * 16 + x] = Math.max(0, Math.min(1, numero(b, 100) / 100)); } },
    apagarTela: function () { tela.rolagem = null; tela.px.fill(0); },
    leds: function (r, g, b) { r = Math.max(0, Math.min(255, numero(r))); g = Math.max(0, Math.min(255, numero(g))); b = Math.max(0, Math.min(255, numero(b))); robo.led = (r || g || b) ? [r, g, b] : null; },
    nota: function (n, batidas) { var seg = Math.max(0, numero(batidas, 0.25)) * 60 / som.tempo; nota(freqMidi(numero(n, 60)), Math.max(0.05, seg / cfg.turbo), 'triangle'); return esperarSeg(seg); },
    falar: function (t) {
      registrar('🗣 ' + t);
      if (!cfg.som || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
      try { var u = new window.SpeechSynthesisUtterance(String(t)); u.lang = 'pt-BR'; window.speechSynthesis.speak(u); } catch (e) { /* sem voz */ }
    },
    silencio: silenciar,
    cor: function (nome) { return classificarCor(corSob(robo.x, robo.y)) === nome; },
    distancia: distanciaFrente,
    rgb: function (i) { return corSob(robo.x, robo.y)[i]; },
    cronometro: function () { return Math.round(exec.crono * 10) / 10; },
    zerarCronometro: function () { exec.crono = 0; },
    pararEste: function () { throw PARAR; }
  };
  // cada execução recebe a sua própria "ficha": um programa parado nunca volta a andar
  function comandosDe(ficha) {
    var r = Object.create(R);
    r.bloco = function (id) { vivo(ficha); if (ws) ws.highlightBlock(id); };
    r.tique = function () { vivo(ficha); return new Promise(function (ok) { proximoQuadro.push(ok); }).then(function () { vivo(ficha); }); };
    r.pararTudo = function () { if (exec.ficha === ficha) pararPrograma(); throw PARAR; };
    return r;
  }

  /* ---------- Execução do programa ---------- */
  function rodarPilha(p, ficha) {
    p.ativa = true;
    Promise.resolve().then(function () { return p.fn(); }).catch(function (e) { if (e !== PARAR) { console.error(e); aviso('Erro no programa: ' + (e && e.message ? e.message : e)); } })
      .then(function () { p.ativa = false; if (exec.ficha === ficha) verificarFim(); });
  }
  function verificarFim() {
    if (!exec.rodando) return;
    var temEvento = exec.pilhas.some(function (p) { return p.cond; }), ativa = exec.pilhas.some(function (p) { return p.ativa; });
    if (!ativa && !temEvento) pararPrograma(true);
  }
  function dispararEventos() {
    if (!exec.rodando) return;
    var ficha = exec.ficha;
    exec.pilhas.forEach(function (p) {
      if (!p.cond || p.avaliando) return;
      p.avaliando = true;
      p.cond().then(function (v) { v = !!v; if (v && !p.anterior && !p.ativa && exec.ficha === ficha) rodarPilha(p, ficha); p.anterior = v; p.avaliando = false; }, function () { p.avaliando = false; });
    });
  }
  function executar() {
    pararPrograma(); audio();
    var pilhas, ficha = { cancelada: false };
    try { pilhas = window.RoboBlocos.compilar(ws, comandosDe(ficha)); } catch (e) { console.error(e); aviso('Não consegui montar o programa: ' + e.message); return; }
    if (!pilhas.length) { aviso('Comece o programa com um bloco de Eventos, como "quando o robô iniciar".'); return; }
    if (!cfg.aberto) alternarPainel(true);
    if (cfg.etapas.length) reiniciar(); else zerarJogo();
    exec.ficha = ficha; exec.pilhas = pilhas; exec.rodando = true; exec.crono = 0;
    ui.btPlay.classList.add('rodando');
    pilhas.forEach(function (p) { if (!p.cond) rodarPilha(p, ficha); });
    verificarFim();
  }
  function pararPrograma(natural) {
    if (exec.ficha) exec.ficha.cancelada = true;
    exec.ficha = null; exec.rodando = false; exec.pilhas = [];
    var esp = exec.esperas; exec.esperas = []; esp.forEach(function (e) { e.ok(); });
    var q = proximoQuadro; proximoQuadro = []; q.forEach(function (ok) { ok(); });
    if (!natural) { pararMovimento(); silenciar(); }
    if (ws) ws.highlightBlock(null);
    if (ui.btPlay) ui.btPlay.classList.remove('rodando');
  }

  /* ---------- Caminhos, sorteio e código do mapa ---------- */
  var DX = [0, 1, 0, -1], DY = [1, 0, -1, 0];
  function analisar(obst, inicio, etapas) {
    var bloqueada = function (c, r) {
      if (!dentro(c, r) || obst.indexOf(chave(c, r)) >= 0) return true;
      if (celulaProibida(c, r)) {
        if (c === inicio.col && r === inicio.row) return false;
        for (var i = 0; i < etapas.length; i++) if (etapas[i].col === c && etapas[i].row === r) return false;
        return true;
      }
      return false;
    };
    var N = MAT.cols * MAT.rows * 4, INF = 1e9, dist = new Array(N).fill(INF);
    var id = function (c, r, d) { return (r * MAT.cols + c) * 4 + d; };
    dist[id(inicio.col, inicio.row, Math.round(inicio.dir / 90) % 4)] = 0;
    for (var e = 0; e < etapas.length; e++) {
      var visit = new Array(N).fill(false), i;
      for (;;) {
        var melhor = -1;
        for (i = 0; i < N; i++) if (!visit[i] && dist[i] < INF && (melhor < 0 || dist[i] < dist[melhor])) melhor = i;
        if (melhor < 0) break;
        visit[melhor] = true;
        var d = melhor % 4, cel = (melhor - d) / 4, c = cel % MAT.cols, r = (cel - c) / MAT.cols, nc = c + DX[d], nr = r + DY[d];
        if (!bloqueada(nc, nr)) { var j = id(nc, nr, d); if (dist[melhor] < dist[j]) dist[j] = dist[melhor]; }
        var e1 = id(c, r, (d + 1) % 4), e2 = id(c, r, (d + 3) % 4);
        if (dist[melhor] + 1 < dist[e1]) dist[e1] = dist[melhor] + 1;
        if (dist[melhor] + 1 < dist[e2]) dist[e2] = dist[melhor] + 1;
      }
      var prox = new Array(N).fill(INF), achou = false;
      for (var dd = 0; dd < 4; dd++) { var k = id(etapas[e].col, etapas[e].row, dd); if (dist[k] < INF) { prox[k] = dist[k]; achou = true; } }
      if (!achou) return { ok: false, curvas: 0 };
      dist = prox;
    }
    var min = INF; for (var q = 0; q < N; q++) if (dist[q] < min) min = dist[q];
    return { ok: true, curvas: min, blocosIdeais: 2 * min + 2 };
  }
  function semente(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function gerarObstaculos(nivel, seed) {
    var rnd = semente(seed === undefined ? (Date.now() ^ (Math.random() * 1e9)) : seed), cfgN = NIVEIS[nivel] || NIVEIS[0];
    if (!cfg.etapas.length) {
      for (var t = 0; t < 200; t++) {
        var c = Math.floor(rnd() * MAT.cols), r = Math.floor(rnd() * MAT.rows);
        if (Math.abs(c - cfg.inicio.col) + Math.abs(r - cfg.inicio.row) >= 6 && !celulaProibida(c, r)) { cfg.etapas = [{ col: c, row: r }]; break; }
      }
    }
    var livres = [];
    for (var cc = 0; cc < MAT.cols; cc++) for (var rr = 0; rr < MAT.rows; rr++) {
      var usada = (cc === cfg.inicio.col && rr === cfg.inicio.row) || cfg.etapas.some(function (e) { return e.col === cc && e.row === rr; });
      if (!usada) livres.push(chave(cc, rr));
    }
    var minC = cfgN.curvas, maxC = cfgN.max, melhor = null;
    for (var tent = 0; tent < 2500; tent++) {
      if (tent && tent % 500 === 0) { if (minC > 0) minC--; maxC++; }
      var pool = livres.slice(), obst = [];
      var qtd = Math.max(1, Math.round(cfgN.qtd * MAT.cols * MAT.rows / 70));
      for (var i = 0; i < qtd && pool.length; i++) obst.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
      var a = analisar(obst, cfg.inicio, cfg.etapas);
      if (a.ok) { if (!melhor) melhor = obst; if (a.curvas >= minC && a.curvas <= maxC) { melhor = obst; break; } }
    }
    if (!melhor) { aviso('Não achei um mapa com solução para esse início e alvo.'); return false; }
    cfg.obst = melhor; cfg.nivel = nivel; salvar('nivel', nivel); salvarMapa(); pararPrograma(); reiniciar();
    return true;
  }
  var ALFA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  function codigoMapa() {
    var bits = [];
    function w(v, n) { for (var i = n - 1; i >= 0; i--) bits.push((v >> i) & 1); }
    w(2, 2); w(Math.max(0, TAPETES.indexOf(TAPETE)), 2); w(cfg.inicio.col, 4); w(cfg.inicio.row, 3); w(Math.round(cfg.inicio.dir / 90) % 4, 2);
    w(Math.max(0, CORES_PROIBIVEIS.indexOf(cfg.proibida)), 3);
    var et = cfg.etapas.slice(0, 7); w(et.length, 3); et.forEach(function (e) { w(e.col, 4); w(e.row, 3); });
    var idx = cfg.obst.map(function (k) { var p = k.split(','); return p[1] * MAT.cols + (+p[0]); }).sort(function (a, b) { return a - b; });
    if (idx.length <= 9) { w(0, 1); w(idx.length, 5); idx.forEach(function (v) { w(v, 7); }); }
    else { w(1, 1); for (var i = 0; i < MAT.cols * MAT.rows; i++) w(idx.indexOf(i) >= 0 ? 1 : 0, 1); }
    while (bits.length % 5) bits.push(0);
    var s = '', soma = 0;
    for (var j = 0; j < bits.length; j += 5) { var v = bits[j] << 4 | bits[j + 1] << 3 | bits[j + 2] << 2 | bits[j + 3] << 1 | bits[j + 4]; s += ALFA[v]; soma = (soma + v * (j / 5 + 1)) % 32; }
    return (s + ALFA[soma]).replace(/(.{4})(?=.)/g, '$1-');
  }
  function abrirCodigo(cod) {
    var s = String(cod).toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1').replace(/U/g, 'V');
    if (s.length < 4) return false;
    var vals = [], i; for (i = 0; i < s.length; i++) { var v = ALFA.indexOf(s[i]); if (v < 0) return false; vals.push(v); }
    var soma = 0; for (i = 0; i < vals.length - 1; i++) soma = (soma + vals[i] * (i + 1)) % 32;
    if (soma !== vals[vals.length - 1]) return false;
    var bits = []; for (i = 0; i < vals.length - 1; i++) for (var b = 4; b >= 0; b--) bits.push((vals[i] >> b) & 1);
    var p = 0, falha = false;
    function r(n) { var v2 = 0; for (var k = 0; k < n; k++) { if (p >= bits.length) { falha = true; return 0; } v2 = v2 << 1 | bits[p++]; } return v2; }
    var ver = r(2), tIdx = 0;
    if (ver === 2) tIdx = r(2); else if (ver !== 1) return false;
    if (tIdx >= TAPETES.length) return false;
    var rb = ROBOS.filter(function (x) { return x.tapete === TAPETES[tIdx].id; })[0];
    if (!rb) return false;
    if (cfg.robo !== rb.id) { cfg.robo = rb.id; salvar('robo', rb.id); carregarRobo(); }
    var ini = { col: r(4), row: r(3), dir: r(2) * 90 }, pro = r(3), n = r(3), et = [], ob = [];
    for (i = 0; i < n; i++) et.push({ col: r(4), row: r(3) });
    if (r(1) === 0) { var q = r(5); for (i = 0; i < q; i++) { var x = r(7); ob.push(chave(x % MAT.cols, Math.floor(x / MAT.cols))); } }
    else for (i = 0; i < MAT.cols * MAT.rows; i++) if (r(1)) ob.push(chave(i % MAT.cols, Math.floor(i / MAT.cols)));
    if (falha || !dentro(ini.col, ini.row) || pro >= CORES_PROIBIVEIS.length) return false;
    if (et.some(function (e) { return !dentro(e.col, e.row); }) || ob.some(function (k) { var pp = k.split(','); return !dentro(+pp[0], +pp[1]); })) return false;
    cfg.inicio = ini; cfg.etapas = et; cfg.obst = ob; cfg.proibida = CORES_PROIBIVEIS[pro];
    salvarMapa(); pararPrograma(); reiniciar(); sincronizarControles();
    return true;
  }

  /* ---------- Missão e pontuação ---------- */
  function contarBlocos() { try { return ws.getAllBlocks(false).filter(function (b) { return !b.isShadow() && b.isEnabled(); }).length; } catch (e) { return 0; } }
  function zerarJogo() { jogo.etapa = 0; jogo.ok = false; jogo.batidas = 0; jogo.pisadas = 0; jogo.tempo = 0; jogo.sobreProibida = false; aviso(''); if (ui.placar) ui.placar.textContent = ''; }
  function verificarJogo() {
    if (cfg.proibida) {
      var sobre = classificarCor(corSob(robo.x, robo.y)) === cfg.proibida;
      if (sobre && !jogo.sobreProibida && exec.rodando) { jogo.pisadas++; aviso('⛔ O robô pisou no ' + NOMES_COR[cfg.proibida] + '.'); nota(180, 0.12, 'square'); }
      jogo.sobreProibida = sobre;
    }
    if (jogo.ok || !cfg.etapas.length || jogo.etapa >= cfg.etapas.length) return;
    var e = cfg.etapas[jogo.etapa];
    if (Math.abs(robo.x - e.col * CEL) < CEL * 0.26 && Math.abs(robo.y - e.row * CEL) < CEL * 0.26) {
      jogo.etapa++;
      if (jogo.etapa >= cfg.etapas.length) concluir();
      else { aviso('✅ Etapa ' + jogo.etapa + ' de ' + cfg.etapas.length + ' concluída.', true); nota(freqMidi(76), 0.12, 'triangle'); }
    }
  }
  function concluir() {
    jogo.ok = true;
    var a = analisar(cfg.obst, cfg.inicio, cfg.etapas), blocos = contarBlocos(), estrelas = 3;
    if (jogo.batidas + jogo.pisadas > 0) estrelas--;
    if (a.ok && blocos > a.blocosIdeais + 3) estrelas--;
    estrelas = Math.max(1, estrelas); jogo.estrelas = estrelas;
    aviso('🎉 Missão cumprida!', true); tocarVitoria();
    ui.placar.textContent = '★★★'.slice(0, estrelas) + '☆☆☆'.slice(0, 3 - estrelas) + ' · ' + blocos + ' blocos' + (a.ok ? ' (ideal ≈ ' + a.blocosIdeais + ')' : '') +
      ' · ' + jogo.batidas + (jogo.batidas === 1 ? ' batida' : ' batidas') + (cfg.proibida ? ' · ' + jogo.pisadas + ' no proibido' : '') + ' · ' + jogo.tempo.toFixed(1).replace('.', ',') + ' s';
  }
  function reiniciar() {
    pararMovimento(); silenciar();
    robo.x = cfg.inicio.col * CEL; robo.y = cfg.inicio.row * CEL; robo.dir = cfg.inicio.dir;
    robo.led = null; mostrarFigura(IMAGENS.olhos); rastro = [[robo.x, robo.y]]; zerarJogo();
  }

  /* ---------- Interface ---------- */
  function el(tag, attrs, filhos) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'style') e.style.cssText = attrs[k]; else if (k === 'text') e.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]); else e.setAttribute(k, attrs[k]);
    });
    (filhos || []).forEach(function (f) { e.appendChild(f); });
    return e;
  }
  function aviso(t, ok) { if (!ui.aviso) return; ui.aviso.textContent = t || ''; ui.aviso.style.color = ok ? '#0a8a4a' : '#b45309'; }
  function registrar(t) { if (ui.log) ui.log.textContent = t; }
  function botao(txt, titulo, fn, classe) { var a = { text: txt, title: titulo, onclick: fn, type: 'button' }; if (classe) a['class'] = classe; return el('button', a); }
  function opcoes(lista) { return lista.map(function (o) { return el('option', { value: o[0], text: o[1] }); }); }

  var SWATCH = { '': '#ffffff', red: '#ee1b22', blue: '#00adef', green: '#00a54f', yellow: '#fff100', purple: '#64439a', black: '#21201e' };
  var NIVEL_COR = ['#2fb344', '#f2b400', '#f08a1c', '#e03131'];
  var DICAS = {
    '': 'Escolha um cartão para montar o desafio.',
    inicio: 'Toque no tapete: onde o robô começa? Depois escolha para onde ele olha.',
    chegada: 'Toque no tapete: onde o robô deve chegar? Toque em mais lugares para criar etapas.',
    obst: 'Toque no tapete para pôr ou tirar caixotes — ou sorteie pelo nível.',
    proibida: 'Escolha uma cor em que o robô não pode pisar.'
  };
  function criarPainel() {
    ui.sim = document.getElementById('sim'); ui.aba = document.getElementById('aba');
    ui.btPlay = document.getElementById('bt-play'); ui.btStop = document.getElementById('bt-stop');
    ui.btPlay.addEventListener('click', executar);
    ui.btStop.addEventListener('click', function () { pararPrograma(); });
    document.getElementById('bt-mais').addEventListener('click', function () { ws.zoomCenter(1); });
    document.getElementById('bt-menos').addEventListener('click', function () { ws.zoomCenter(-1); });
    document.getElementById('bt-centro').addEventListener('click', function () { ws.zoomToFit(); if (ws.scale > 1.1) ws.setScale(1); ws.scrollCenter(); });
    ui.aba.addEventListener('click', function () { alternarPainel(); });

    ui.canvas = el('canvas', { 'class': 'mat', title: 'Tapete de missões' });
    ui.face = el('canvas', { 'class': 'face', width: 168, height: 88, title: 'Telinha do rosto do robô' });
    ui.chipPos = el('span', { 'class': 'chip', title: 'Onde o robô está' });
    ui.seta = el('i', { 'class': 'seta', text: '➤' });
    ui.chipDir = el('span', { 'class': 'chip', title: 'Para onde o robô olha' }, [ui.seta]);
    ui.bolaCor = el('i', { 'class': 'bola' }); ui.nomeCor = el('b', {});
    ui.chipCor = el('span', { 'class': 'chip', title: 'Cor que o sensor está vendo' }, [ui.bolaCor, ui.nomeCor]);
    ui.chipDist = el('span', { 'class': 'chip', title: 'Distância até o obstáculo à frente' });
    ui.log = el('div', { 'class': 'log' });
    ui.aviso = el('div', { 'class': 'aviso' }); ui.placar = el('div', { 'class': 'placar' });
    ui.modo = '';

    // cartões de ferramenta
    function cartao(id, icone, rotulo) {
      var b = el('button', { type: 'button', 'class': 'cartao c-' + id, title: DICAS[id] }, [el('span', { 'class': 'ic', text: icone }), el('span', { text: rotulo })]);
      b.addEventListener('click', function () { ui.modo = ui.modo === id ? '' : id; marcar(); });
      return b;
    }
    ui.cartoes = { inicio: cartao('inicio', '🤖', 'Início'), chegada: cartao('chegada', '🏁', 'Chegada'), obst: cartao('obst', '🧱', 'Obstáculos'), proibida: cartao('proibida', '⛔', 'Cor proibida') };
    ui.dica = el('div', { 'class': 'dica' });

    // opções de cada ferramenta
    ui.dirs = [['↑', 0, 'Norte'], ['→', 90, 'Leste'], ['↓', 180, 'Sul'], ['←', 270, 'Oeste']].map(function (d) {
      var b = botao(d[0], 'Olhar para o ' + d[2], function () { cfg.inicio.dir = d[1]; mudouMapa(); }, 'dir'); b.dataset.dir = d[1]; return b;
    });
    ui.opInicio = el('div', { 'class': 'opcoes' }, [el('span', { 'class': 'rot', text: 'Olhando para:' })].concat(ui.dirs));
    ui.opChegada = el('div', { 'class': 'opcoes' });
    ui.niveis = NIVEIS.map(function (n, i) {
      var b = el('button', { type: 'button', 'class': 'nivel', title: 'Sortear caixotes — nível ' + n.nome.toLowerCase() + ' (sempre existe um caminho)' }, [el('span', { 'class': 'dado', text: '🎲' }), el('span', { text: n.nome })]);
      b.style.setProperty('--cor', NIVEL_COR[i]);
      b.addEventListener('click', function () { if (gerarObstaculos(i)) { sincronizarControles(); aviso('Mapa sorteado: ' + n.nome.toLowerCase() + '!', true); } });
      return b;
    });
    ui.opObst = el('div', { 'class': 'opcoes' }, ui.niveis.concat([botao('🧹', 'Tirar todos os caixotes', function () { cfg.obst = []; mudouMapa(); }, 'num')]));
    ui.cores = CORES_PROIBIVEIS.map(function (c) {
      var b = el('button', { type: 'button', 'class': 'cor', title: c ? 'Não pisar no ' + NOMES_COR[c] : 'Nenhuma cor proibida', text: c ? '' : '✕' });
      b.style.background = SWATCH[c]; b.dataset.cor = c;
      b.addEventListener('click', function () { cfg.proibida = c; mudouMapa(); });
      return b;
    });
    ui.opProibida = el('div', { 'class': 'opcoes' }, ui.cores);

    ui.btReset = botao('⟲ De novo', 'Volta o robô para o início, no mesmo mapa', function () { pararPrograma(); reiniciar(); }, 'grande');
    ui.btRastro = botao('✎', 'Mostrar ou esconder o caminho do robô', function () { cfg.rastro = !cfg.rastro; salvar('rastro', cfg.rastro); marcar(); }, 'icone');
    ui.btTurbo = botao('', 'Velocidade da simulação', function () { cfg.turbo = cfg.turbo === 1 ? 2 : cfg.turbo === 2 ? 4 : 1; salvar('turbo', cfg.turbo); marcar(); }, 'icone largo');
    ui.btSom = botao('', 'Ligar ou desligar o som', function () { cfg.som = !cfg.som; salvar('som', cfg.som); if (!cfg.som) silenciar(); else audio(); marcar(); }, 'icone');
    ui.robos = ROBOS.map(function (r) {
      return el('button', { 'class': 'robo', type: 'button', title: 'Usar o ' + r.nome + ' (com o tapete dele)', 'data-robo': r.id, onclick: function () { cfg.robo = r.id; salvar('robo', cfg.robo); carregarRobo(); sincronizarControles(); } },
        [el('img', { src: r.img, alt: '' }), el('span', { text: r.nome })]);
    });
    ui.escolhaRobo = el('div', { 'class': 'escolha-robo' }, [el('div', { 'class': 'titulo', text: '🤖 Escolha o robô — cada um tem o seu tapete' }), el('div', { 'class': 'robos' }, ui.robos)]);

    ui.cod = el('input', { 'class': 'cod', title: 'Quem digitar o mesmo código recebe o mesmo desafio', spellcheck: 'false' });
    ui.cod.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') ui.btAbrir.click(); });
    ui.btAbrir = botao('Abrir', 'Abre o mapa do código digitado', function () {
      if (abrirCodigo(ui.cod.value)) { aviso('Mapa aberto!', true); ui.cod.blur(); } else aviso('Código inválido. Confira as letras e os números.');
    });
    ui.btCopiar = botao('Copiar', 'Copia o código do mapa', function () {
      var c = codigoMapa();
      try { navigator.clipboard.writeText(c).then(function () { aviso('Código copiado!', true); }, function () { ui.cod.select(); }); } catch (e) { ui.cod.select(); }
    });
    ui.btMenor = botao('−', 'Diminuir o painel', function () { redimensionar(-1); });
    ui.btMaior = botao('+', 'Aumentar o painel', function () { redimensionar(1); });

    ui.sim.appendChild(el('div', { 'class': 'top' }, [el('span', { text: '🗺️ Tapete de Missões' }), ui.btMenor, ui.btMaior]));
    ui.sim.appendChild(el('div', { 'class': 'corpo' }, [
      el('div', { 'class': 'moldura' }, [ui.canvas]),
      el('div', { 'class': 'status' }, [ui.face, el('div', { 'class': 'chips' }, [ui.chipPos, ui.chipDir, ui.chipCor, ui.chipDist])]),
      ui.aviso, ui.placar, ui.log,
      el('div', { 'class': 'acoes' }, [ui.btReset, ui.btRastro, ui.btTurbo, ui.btSom]),
      ui.escolhaRobo,
      el('div', { 'class': 'montar' }, [
        el('div', { 'class': 'titulo', text: '🛠️ Montar o desafio' }),
        el('div', { 'class': 'cartoes' }, [ui.cartoes.inicio, ui.cartoes.chegada, ui.cartoes.obst, ui.cartoes.proibida]),
        ui.dica, ui.opInicio, ui.opChegada, ui.opObst, ui.opProibida
      ]),
      el('details', { 'class': 'codigo' }, [el('summary', { text: '🔑 Código do mapa' }), el('div', { 'class': 'linha' }, [ui.cod, ui.btAbrir, ui.btCopiar])])
    ]));

    ui.canvas.addEventListener('click', function (e) {
      var r = ui.canvas.getBoundingClientRect(), k = MAT.w / r.width;
      var c = celulaDe(((e.clientX - r.left) * k - MAT.ax) / MAT.ppcX, (MAT.ay - (e.clientY - r.top) * k) / MAT.ppcY);
      if (!c) return;
      if (!ui.modo || ui.modo === 'proibida') { aviso('Para mudar o tapete, escolha um cartão em "Montar o desafio".'); return; }
      var noInicio = c.col === cfg.inicio.col && c.row === cfg.inicio.row, iEtapa = -1;
      cfg.etapas.forEach(function (et, i) { if (et.col === c.col && et.row === c.row) iEtapa = i; });
      if (ui.modo === 'chegada') {
        if (iEtapa >= 0) cfg.etapas.splice(iEtapa, 1);
        else { if (noInicio) return; if (cfg.etapas.length >= 7) { aviso('No máximo 7 etapas.'); return; } cfg.etapas.push({ col: c.col, row: c.row }); tirarObst(c); }
      } else if (ui.modo === 'obst') {
        if (noInicio || iEtapa >= 0) { aviso('Aqui não dá: é o início ou a chegada.'); return; }
        var i2 = cfg.obst.indexOf(chave(c.col, c.row)); if (i2 >= 0) cfg.obst.splice(i2, 1); else cfg.obst.push(chave(c.col, c.row));
      } else { if (iEtapa >= 0) return; cfg.inicio.col = c.col; cfg.inicio.row = c.row; tirarObst(c); }
      mudouMapa();
    });
    window.addEventListener('resize', ajustar);
    montarAtalhos(); sincronizarControles(); ajustar(); marcar();
  }
  function montarAtalhos() {
    if (!ui.opChegada) return;
    ui.opChegada.textContent = '';
    ui.opChegada.appendChild(el('span', { 'class': 'rot', text: 'Atalhos:' }));
    ESTACOES.forEach(function (e) {
      ui.opChegada.appendChild(botao(e[0], 'Chegar no ' + e[2], function () { cfg.etapas = [parseCelula(e[1])]; cfg.etapas.forEach(tirarObst); mudouMapa(); }, 'num'));
    });
    if (ESTACOES.length > 1) {
      var ult = ESTACOES[ESTACOES.length - 1];
      ui.opChegada.appendChild(botao(ESTACOES[0][0] + ' → ' + ult[0], 'Passar por todos, em ordem', function () { cfg.etapas = ESTACOES.map(function (e) { return parseCelula(e[1]); }); cfg.etapas.forEach(tirarObst); mudouMapa(); }, 'num largo'));
    }
    ui.opChegada.appendChild(botao('🧹', 'Tirar a chegada', function () { cfg.etapas = []; mudouMapa(); }, 'num'));
  }
  function mudouMapa() { salvarMapa(); pararPrograma(); reiniciar(); sincronizarControles(); }
  function tirarObst(c) { var i = cfg.obst.indexOf(chave(c.col, c.row)); if (i >= 0) cfg.obst.splice(i, 1); }
  function sincronizarControles() {
    ui.dirs.forEach(function (b) { b.classList.toggle('ativo', +b.dataset.dir === cfg.inicio.dir); });
    ui.cores.forEach(function (b) { b.classList.toggle('ativo', b.dataset.cor === cfg.proibida); });
    ui.robos.forEach(function (b) { b.classList.toggle('ativo', b.dataset.robo === cfg.robo); });
    if (document.activeElement !== ui.cod) ui.cod.value = codigoMapa();
  }
  function marcar() {
    Object.keys(ui.cartoes).forEach(function (k) { ui.cartoes[k].classList.toggle('ativo', ui.modo === k); });
    ui.dica.textContent = DICAS[ui.modo];
    ui.opInicio.style.display = ui.modo === 'inicio' ? '' : 'none'; ui.opChegada.style.display = ui.modo === 'chegada' ? '' : 'none';
    ui.opObst.style.display = ui.modo === 'obst' ? '' : 'none'; ui.opProibida.style.display = ui.modo === 'proibida' ? '' : 'none';
    ui.canvas.style.cursor = ui.modo && ui.modo !== 'proibida' ? 'crosshair' : 'default';
    ui.btRastro.classList.toggle('ativo', cfg.rastro);
    ui.btTurbo.textContent = '⏩ ' + cfg.turbo + 'x'; ui.btSom.textContent = cfg.som ? '🔊' : '🔇';
  }
  function alternarPainel(abrir) { cfg.aberto = abrir === undefined ? !cfg.aberto : abrir; salvar('aberto', cfg.aberto); ajustar(); }
  function redimensionar(s) {
    var tam = [340, 480, 600, 740], i = tam.indexOf(cfg.largura); if (i < 0) i = 1;
    i = Math.max(0, Math.min(tam.length - 1, i + s)); cfg.largura = tam[i]; salvar('largura', cfg.largura); ajustar();
  }
  function ajustar() {
    var estreito = window.innerWidth < 760 || window.innerHeight < 520;
    document.getElementById('area').classList.toggle('estreito', estreito);
    var w = estreito ? Math.max(220, Math.min(560, window.innerWidth - 60)) : Math.max(220, Math.min(cfg.largura, Math.round(window.innerWidth * 0.55) - 20));
    ui.aba.style.right = estreito ? (cfg.aberto ? (w + 20) + 'px' : '0px') : '';
    ui.canvas.width = MAT.w; ui.canvas.height = MAT.h;
    ui.canvas.style.width = w + 'px'; ui.canvas.style.height = Math.round(w * MAT.h / MAT.w) + 'px';
    ui.sim.style.width = cfg.aberto ? (w + 20) + 'px' : '0px';
    ui.sim.classList.toggle('fechado', !cfg.aberto);
    ui.aba.textContent = cfg.aberto ? '›' : '‹';
    ui.aba.title = cfg.aberto ? 'Fechar o simulador' : 'Abrir o simulador';
    if (ws) { window.Blockly.svgResize(ws); setTimeout(function () { window.Blockly.svgResize(ws); }, 220); }
  }

  function px(x) { return MAT.ax + x * MAT.ppcX; }
  function py(y) { return MAT.ay - y * MAT.ppcY; }
  function desenhar() {
    var g = ui.canvas.getContext('2d'), i;
    var uX = CEL * MAT.ppcX, uY = CEL * MAT.ppcY, k = Math.sqrt(uX * uY) / 105;
    g.clearRect(0, 0, MAT.w, MAT.h);
    if (imgTapete.complete && imgTapete.naturalWidth) g.drawImage(imgTapete, 0, 0, MAT.w, MAT.h);
    if (cfg.proibida && corCelula) {
      for (var c = 0; c < MAT.cols; c++) for (var r = 0; r < MAT.rows; r++) if (corCelula[c][r] === cfg.proibida) {
        var fx = px(c * CEL), fy = py(r * CEL);
        g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(fx, fy, 20 * k, 0, Math.PI * 2); g.fill();
        g.lineWidth = 6 * k; g.strokeStyle = '#d11'; g.beginPath(); g.arc(fx, fy, 17 * k, 0, Math.PI * 2); g.moveTo(fx - 12 * k, fy - 12 * k); g.lineTo(fx + 12 * k, fy + 12 * k); g.stroke();
      }
    }
    var toX = TAM_OBST * MAT.ppcX, toY = TAM_OBST * MAT.ppcY, m3 = 3 * k, m8 = 8 * k;
    cfg.obst.forEach(function (kk) {
      var p = kk.split(','), ox = px(p[0] * CEL), oy = py(p[1] * CEL);
      g.fillStyle = '#b5793f'; g.strokeStyle = '#6f4420'; g.lineWidth = 6 * k;
      g.fillRect(ox - toX / 2, oy - toY / 2, toX, toY); g.strokeRect(ox - toX / 2 + m3, oy - toY / 2 + m3, toX - 2 * m3, toY - 2 * m3);
      g.lineWidth = 5 * k; g.beginPath(); g.moveTo(ox - toX / 2 + m8, oy - toY / 2 + m8); g.lineTo(ox + toX / 2 - m8, oy + toY / 2 - m8);
      g.moveTo(ox + toX / 2 - m8, oy - toY / 2 + m8); g.lineTo(ox - toX / 2 + m8, oy + toY / 2 - m8); g.stroke();
    });
    var t = Date.now() / 300;
    cfg.etapas.forEach(function (e, n) {
      var ex = px(e.col * CEL), ey = py(e.row * CEL), feita = n < jogo.etapa, atual = n === jogo.etapa && !jogo.ok;
      g.lineWidth = 7 * k; g.strokeStyle = feita ? '#0a8a4a' : atual ? 'rgba(230,50,50,' + (0.65 + 0.3 * Math.sin(t)) + ')' : 'rgba(230,50,50,.45)';
      g.setLineDash([16 * k, 10 * k]); g.strokeRect(ex - uX * 0.47, ey - uY * 0.47, uX * 0.94, uY * 0.94); g.setLineDash([]);
      if (cfg.etapas.length > 1 || feita) {
        g.fillStyle = feita ? '#0a8a4a' : '#e23232'; g.beginPath(); g.arc(ex + uX * 0.34, ey - uY * 0.34, 17 * k, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#fff'; g.font = 'bold ' + Math.round(24 * k) + 'px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(feita ? '✓' : String(n + 1), ex + uX * 0.34, ey - uY * 0.34 + k);
      }
    });
    var ix = px(cfg.inicio.col * CEL), iy = py(cfg.inicio.row * CEL);
    g.lineWidth = 4 * k; g.strokeStyle = 'rgba(40,40,40,.55)'; g.setLineDash([6 * k, 6 * k]); g.beginPath(); g.arc(ix, iy, 46 * k, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    if (cfg.rastro && rastro.length > 1) {
      g.lineWidth = 6 * k; g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = 'rgba(255,90,0,.75)';
      g.beginPath(); g.moveTo(px(rastro[0][0]), py(rastro[0][1]));
      for (i = 1; i < rastro.length; i++) g.lineTo(px(rastro[i][0]), py(rastro[i][1]));
      g.stroke();
    }
    var tam = TAM_ROBO * Math.sqrt(MAT.ppcX * MAT.ppcY);
    g.save(); g.translate(px(robo.x), py(robo.y)); g.rotate((robo.dir + (robo.balanco || 0)) * Math.PI / 180);
    if (robo.led) {
      g.shadowColor = 'rgb(' + robo.led.join(',') + ')'; g.shadowBlur = 40 * k;
      g.fillStyle = 'rgba(' + robo.led.join(',') + ',.55)'; g.beginPath(); g.arc(0, 0, tam * 0.56, 0, Math.PI * 2); g.fill(); g.shadowBlur = 0;
    }
    g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 12 * k; g.shadowOffsetY = 3 * k;
    if (imgRobo.complete && imgRobo.naturalWidth) g.drawImage(imgRobo, -tam / 2, -tam / 2, tam, tam);
    else { g.fillStyle = '#f0841c'; g.fillRect(-tam / 2, -tam / 2, tam, tam); }
    g.shadowColor = 'transparent'; g.fillStyle = '#fff'; g.strokeStyle = '#222'; g.lineWidth = 3 * k;
    g.beginPath(); g.moveTo(0, -tam / 2 - 20 * k); g.lineTo(-13 * k, -tam / 2 - 2 * k); g.lineTo(13 * k, -tam / 2 - 2 * k); g.closePath(); g.fill(); g.stroke();
    g.restore();

    var f = ui.face.getContext('2d'); f.clearRect(0, 0, 168, 88);
    for (var y = 0; y < 8; y++) for (var x = 0; x < 16; x++) {
      var v = tela.px[y * 16 + x];
      f.fillStyle = v > 0 ? 'rgba(120,225,255,' + (0.25 + 0.75 * v) + ')' : '#232b36';
      f.beginPath(); f.arc(9 + x * 10, 9 + y * 10, 3.8, 0, Math.PI * 2); f.fill();
    }
    if (robo.led) { f.fillStyle = 'rgb(' + robo.led.join(',') + ')'; f.fillRect(0, 84, 168, 4); }
    var cel = celulaDe(robo.x, robo.y), cor = classificarCor(corSob(robo.x, robo.y));
    var rgbSensor = corSob(robo.x, robo.y);
    ui.chipPos.textContent = '📍 ' + (cel ? cel.nome : 'fora');
    ui.seta.style.transform = 'rotate(' + (robo.dir - 90) + 'deg)'; ui.chipDir.title = 'Olhando para o ' + nomeDir(robo.dir);
    ui.bolaCor.style.background = 'rgb(' + rgbSensor.join(',') + ')'; ui.nomeCor.textContent = NOMES_COR[cor] || cor;
    ui.chipDist.textContent = '📏 ' + String(distanciaFrente()).replace('.', ',') + ' cm';
    if (document.activeElement !== ui.cod) { var cd = codigoMapa(); if (ui.cod.value !== cd) ui.cod.value = cd; }
  }

  var ultimo = 0;
  function quadro(agora) {
    var dt = Math.min(0.05, (agora - ultimo) / 1000 || 0); ultimo = agora;
    var q = proximoQuadro; proximoQuadro = []; q.forEach(function (ok) { ok(); });
    passo(dt); desenhar();
    window.requestAnimationFrame(quadro);
  }

  /* ---------- Editor de blocos ---------- */
  var PROGRAMA_INICIAL = { blocks: { languageVersion: 0, blocks: [{ type: 'rb_quando_iniciar', x: 40, y: 40,
    next: { block: { type: 'rb_mover', fields: { DIR: 'forward', UN: 'cm' }, inputs: { VALOR: { shadow: { type: 'math_number', fields: { NUM: 10 } } } } } } }] } };
  function criarEditor() {
    var B = window.Blockly;
    ws = B.inject('blockly', {
      toolbox: window.RoboBlocos.CAIXA, theme: window.RoboBlocos.TEMA, renderer: 'zelos', sounds: false, trashcan: false,
      media: 'data:,', grid: { spacing: 28, length: 2, colour: '#d5dbe3', snap: false },
      zoom: { controls: false, wheel: true, startScale: (window.innerWidth < 760 || window.innerHeight < 520) ? 0.75 : 1, maxScale: 1.6, minScale: 0.4, scaleSpeed: 1.1 }, move: { scrollbars: true, drag: true, wheel: true }
    });
    var salvo = carregar('programa', null);
    try { B.serialization.workspaces.load(salvo || PROGRAMA_INICIAL, ws); } catch (e) { console.warn(e); B.serialization.workspaces.load(PROGRAMA_INICIAL, ws); }
    var espera = null;
    ws.addChangeListener(function (ev) {
      if (ev.isUiEvent) return;
      clearTimeout(espera); espera = setTimeout(function () { salvar('programa', B.serialization.workspaces.save(ws)); }, 400);
    });
  }
  function mapaValido() {
    return dentro(cfg.inicio.col, cfg.inicio.row) && cfg.etapas.every(function (e) { return dentro(e.col, e.row); }) &&
      cfg.obst.every(function (k) { var p = k.split(','); return dentro(+p[0], +p[1]); });
  }
  function aplicarTapete(id) {
    var t = TAPETES.filter(function (x) { return x.id === id; })[0] || TAPETES[0], mudou = TAPETE !== t;
    TAPETE = t; MAT = { w: t.w, h: t.h, ax: t.ax, ay: t.ay, ppcX: t.ppcX, ppcY: t.ppcY, cols: t.cols, rows: t.rows };
    CEL = t.cel; LINV = !!t.inv; ESTACOES = t.est || []; TAM_OBST = 0.9 * CEL;
    if (mudou) {
      amostra = null; corCelula = null; imgTapete.onload = tapeteCarregado; imgTapete.src = t.img;
      if (ui.canvas) ajustar();
    }
    if (!mapaValido()) { cfg.inicio = { col: 0, row: 0, dir: 0 }; cfg.etapas = []; cfg.obst = []; cfg.proibida = ''; salvarMapa(); }
    if (mudou && ui.canvas) { montarAtalhos(); pararPrograma(); reiniciar(); sincronizarControles(); }
    return mudou;
  }
  function tapeteCarregado() {
    var c = document.createElement('canvas'); c.width = MAT.w; c.height = MAT.h;
    amostra = c.getContext('2d', { willReadFrequently: true }); amostra.drawImage(imgTapete, 0, 0, MAT.w, MAT.h);
    var cc, rr, m = [];
    for (cc = 0; cc < MAT.cols; cc++) { m.push([]); for (rr = 0; rr < MAT.rows; rr++) m[cc].push(classificarCor(corSob(cc * CEL, rr * CEL))); }
    corCelula = m;
  }
  function carregarRobo() {
    var r = ROBOS.filter(function (x) { return x.id === cfg.robo; })[0] || ROBOS[0]; cfg.robo = r.id; TAM_ROBO = r.tam; imgRobo.src = r.img;
    if (TAPETE && TAPETE.id !== r.tapete) { cfg.inicio = { col: 0, row: 0, dir: 0 }; cfg.etapas = []; cfg.obst = []; cfg.proibida = ''; salvarMapa(); }
    aplicarTapete(r.tapete);
    if (ui.robos) ui.robos.forEach(function (b) { b.classList.toggle('ativo', b.dataset.robo === r.id); });
  }

  function pronto() {
    carregarRobo();
    document.getElementById('logo').src = A.logo;
    criarEditor(); criarPainel(); reiniciar();
    window.requestAnimationFrame(quadro);
  }
  window.RoboVirtual = { R: R, robo: robo, cfg: cfg, jogo: jogo, tela: tela, exec: exec, executar: executar, parar: pararPrograma, reiniciar: reiniciar,
    gerar: gerarObstaculos, analisar: function () { return analisar(cfg.obst, cfg.inicio, cfg.etapas); }, codigo: codigoMapa, abrirCodigo: abrirCodigo,
    mudouMapa: mudouMapa, tapete: function () { return TAPETE; }, trocarRobo: function (id) { cfg.robo = id; salvar('robo', id); carregarRobo(); }, nomeCel: nomeCel, parseCelula: parseCelula, celula: function () { return celulaDe(robo.x, robo.y); }, ws: function () { return ws; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pronto); else pronto();
})();
