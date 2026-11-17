/*
 * Robô Virtual — Tapete de Missões
 * Definição dos blocos (em português), do gerador de código e da caixa de ferramentas.
 * Editor de blocos: Blockly (Google, licença Apache-2.0).
 */
(function () {
  'use strict';
  var B = window.Blockly;

  var CORES = [['branco', 'white'], ['preto', 'black'], ['vermelho', 'red'], ['amarelo', 'yellow'], ['verde', 'green'], ['azul', 'blue'], ['roxo', 'purple'], ['cinza', 'grey']];
  var FRENTE_TRAS = [['para frente', 'forward'], ['para trás', 'backward']];
  var ESQ_DIR = [['à esquerda', 'left'], ['à direita', 'right']];
  var UN_DIST = [['cm', 'cm'], ['polegadas', 'inch'], ['segundos', 'seconds']];
  var UN_DIST2 = [['cm', 'cm'], ['polegadas', 'inch']];
  var UN_ANG = [['graus', 'degrees'], ['voltas', 'rotations'], ['segundos', 'seconds']];
  var UN_ANG2 = [['graus', 'degrees'], ['voltas', 'rotations']];
  var COMPARA = [['>', '>'], ['<', '<']];
  var IMAGENS = [['olhos', 'olhos'], ['feliz', 'feliz'], ['triste', 'triste'], ['surpreso', 'surpreso'], ['coração', 'coracao'], ['certo', 'certo'], ['errado', 'errado'], ['seta', 'seta']];
  var CORES_LED = [['vermelho', '255,0,0'], ['laranja', '255,120,0'], ['amarelo', '255,220,0'], ['verde', '0,200,60'], ['azul', '0,110,255'], ['roxo', '150,60,220'], ['rosa', '255,90,170'], ['branco', '255,255,255']];

  function dd(nome, opcoes) { return { type: 'field_dropdown', name: nome, options: opcoes }; }
  function val(nome, check) { var o = { type: 'input_value', name: nome }; if (check) o.check = check; return o; }
  function cmd(tipo, estilo, msg, args, dica) { return { type: tipo, message0: msg, args0: args || [], previousStatement: null, nextStatement: null, style: estilo, tooltip: dica || '', inputsInline: true }; }
  function chapeu(tipo, msg, args, dica) { return { type: tipo, message0: msg, args0: args || [], nextStatement: null, style: 'evento_blocks', tooltip: dica || '', inputsInline: true }; }
  function rep(tipo, estilo, msg, args, saida, dica) { return { type: tipo, message0: msg, args0: args || [], output: saida, style: estilo, tooltip: dica || '', inputsInline: true }; }

  B.common.defineBlocksWithJsonArray([
    /* Eventos */
    chapeu('rb_quando_iniciar', 'quando o robô iniciar', [], 'Começa ao clicar no botão verde.'),
    chapeu('rb_quando_obstaculo', 'quando a distância do obstáculo for %1 %2', [dd('COMP', COMPARA), val('VALOR', 'Number')]),
    chapeu('rb_quando_cor', 'quando a cor %1 for detectada', [dd('COR', CORES)]),
    /* Movimento */
    cmd('rb_mover', 'movimento_blocks', 'mover %1 por %2 %3', [dd('DIR', FRENTE_TRAS), val('VALOR', 'Number'), dd('UN', UN_DIST)], '1 quadrante do tapete = 10 cm.'),
    cmd('rb_girar', 'movimento_blocks', 'girar %1 por %2 %3', [dd('DIR', ESQ_DIR), val('VALOR', 'Number'), dd('UN', UN_ANG)]),
    cmd('rb_iniciar_mover', 'movimento_blocks', 'começar a mover %1 com %2 % de velocidade', [dd('DIR', FRENTE_TRAS), val('VEL', 'Number')], 'O robô continua andando até um bloco "parar de mover".'),
    cmd('rb_iniciar_girar', 'movimento_blocks', 'começar a girar %1 com %2 % de velocidade', [dd('DIR', ESQ_DIR), val('VEL', 'Number')]),
    cmd('rb_parar_mover', 'movimento_blocks', 'parar de mover'),
    cmd('rb_mover_vel', 'movimento_blocks', 'mover %1 por %2 %3 com %4 % de velocidade', [dd('DIR', FRENTE_TRAS), val('VALOR', 'Number'), dd('UN', UN_DIST2), val('VEL', 'Number')], 'Não espera terminar: o próximo bloco já começa.'),
    cmd('rb_mover_vel_fim', 'movimento_blocks', 'mover %1 por %2 %3 com %4 % de velocidade até terminar', [dd('DIR', FRENTE_TRAS), val('VALOR', 'Number'), dd('UN', UN_DIST2), val('VEL', 'Number')]),
    cmd('rb_girar_vel', 'movimento_blocks', 'girar %1 por %2 %3 com %4 % de velocidade', [dd('DIR', ESQ_DIR), val('VALOR', 'Number'), dd('UN', UN_ANG2), val('VEL', 'Number')], 'Não espera terminar: o próximo bloco já começa.'),
    cmd('rb_girar_vel_fim', 'movimento_blocks', 'girar %1 por %2 %3 com %4 % de velocidade até terminar', [dd('DIR', ESQ_DIR), val('VALOR', 'Number'), dd('UN', UN_ANG2), val('VEL', 'Number')]),
    /* Luz */
    cmd('rb_imagem', 'luz_blocks', 'mostrar imagem %1', [dd('IMG', IMAGENS)], 'Mostra uma imagem na telinha do rosto.'),
    cmd('rb_imagem_tempo', 'luz_blocks', 'mostrar imagem %1 por %2 segundos', [dd('IMG', IMAGENS), val('SEG', 'Number')]),
    cmd('rb_texto', 'luz_blocks', 'mostrar texto %1', [val('TEXTO')]),
    cmd('rb_pixel', 'luz_blocks', 'acender ponto em x: %1 y: %2 com brilho %3 %', [val('X', 'Number'), val('Y', 'Number'), val('BRILHO', 'Number')], 'x de 0 a 15, y de 0 a 7.'),
    cmd('rb_apagar_tela', 'luz_blocks', 'apagar a tela'),
    cmd('rb_leds_cor', 'luz_blocks', 'acender as luzes na cor %1', [dd('COR', CORES_LED)]),
    cmd('rb_leds_rgb', 'luz_blocks', 'acender as luzes com vermelho %1 verde %2 azul %3', [val('R', 'Number'), val('G', 'Number'), val('B', 'Number')], 'Valores de 0 a 255.'),
    cmd('rb_leds_apagar', 'luz_blocks', 'apagar as luzes'),
    /* Som */
    cmd('rb_nota', 'som_blocks', 'tocar nota %1 por %2 batidas', [val('NOTA', 'Number'), val('BATIDAS', 'Number')], '60 é o dó central.'),
    cmd('rb_falar', 'som_blocks', 'falar %1', [val('TEXTO')]),
    cmd('rb_silencio', 'som_blocks', 'parar todos os sons'),
    /* Sensores */
    rep('rb_cor', 'sensor_blocks', 'cor %1 detectada?', [dd('COR', CORES)], 'Boolean', 'Verdadeiro quando o robô está sobre essa cor.'),
    rep('rb_obstaculo', 'sensor_blocks', 'distância do obstáculo %1 %2 ?', [dd('COMP', COMPARA), val('VALOR', 'Number')], 'Boolean'),
    rep('rb_distancia', 'sensor_blocks', 'distância do obstáculo (cm)', [], 'Number', 'Distância até o obstáculo ou a borda à frente.'),
    rep('rb_rgb', 'sensor_blocks', 'valor de %1 da cor', [dd('CANAL', [['vermelho', '0'], ['verde', '1'], ['azul', '2']])], 'Number'),
    rep('rb_cronometro', 'sensor_blocks', 'cronômetro', [], 'Number', 'Segundos desde o início ou desde que foi zerado.'),
    cmd('rb_zerar_cronometro', 'sensor_blocks', 'zerar cronômetro'),
    /* Controle */
    cmd('rb_esperar', 'controle_blocks', 'esperar %1 segundos', [val('SEG', 'Number')]),
    { type: 'rb_repetir', message0: 'repetir %1 vezes', args0: [val('VEZES', 'Number')], message1: '%1', args1: [{ type: 'input_statement', name: 'FAZER' }], previousStatement: null, nextStatement: null, style: 'controle_blocks', inputsInline: true },
    { type: 'rb_sempre', message0: 'sempre', message1: '%1', args1: [{ type: 'input_statement', name: 'FAZER' }], previousStatement: null, style: 'controle_blocks' },
    { type: 'rb_se', message0: 'se %1 então', args0: [val('COND', 'Boolean')], message1: '%1', args1: [{ type: 'input_statement', name: 'FAZER' }], previousStatement: null, nextStatement: null, style: 'controle_blocks', inputsInline: true },
    { type: 'rb_se_senao', message0: 'se %1 então', args0: [val('COND', 'Boolean')], message1: '%1', args1: [{ type: 'input_statement', name: 'FAZER' }], message2: 'senão', message3: '%1', args3: [{ type: 'input_statement', name: 'SENAO' }], previousStatement: null, nextStatement: null, style: 'controle_blocks', inputsInline: true },
    cmd('rb_esperar_ate', 'controle_blocks', 'esperar até %1', [val('COND', 'Boolean')]),
    { type: 'rb_repetir_ate', message0: 'repetir até %1', args0: [val('COND', 'Boolean')], message1: '%1', args1: [{ type: 'input_statement', name: 'FAZER' }], previousStatement: null, nextStatement: null, style: 'controle_blocks', inputsInline: true },
    { type: 'rb_parar', message0: 'parar %1', args0: [dd('O_QUE', [['tudo', 'tudo'], ['este script', 'este']])], previousStatement: null, style: 'controle_blocks' }
  ]);

  /* ---------- Execução dos blocos (interpretador próprio, sem gerar código) ---------- */
  var CHAPEUS = { rb_quando_iniciar: 1, rb_quando_obstaculo: 1, rb_quando_cor: 1 };

  function compilar(ws, R) {
    var vars = {}, procs = {};
    ws.getTopBlocks(true).forEach(function (b) {
      if ((b.type === 'procedures_defnoreturn' || b.type === 'procedures_defreturn') && b.isEnabled()) procs[b.getFieldValue('NAME')] = b;
    });
    function alvo(b, nome) { return b.getInputTargetBlock(nome); }
    async function val(b, nome, padrao) { var t = alvo(b, nome); return t ? await avaliar(t) : padrao; }
    async function num(b, nome, padrao) { var v = Number(await val(b, nome, padrao)); return isFinite(v) ? v : 0; }
    async function corpo(b, nome) { var t = alvo(b, nome); return t ? rodar(t) : undefined; }
    function compara(a, op, c) { return op === '>' ? a > c : a < c; }

    async function chamar(b) {
      var def = procs[b.getFieldValue('NAME')];
      if (!def) return undefined;
      var modelos = def.getVarModels ? def.getVarModels() : [], novos = [], i;
      for (i = 0; i < modelos.length; i++) novos.push(await val(b, 'ARG' + i, 0));
      var antigos = modelos.map(function (m) { return vars[m.getId()]; });
      modelos.forEach(function (m, k) { vars[m.getId()] = novos[k]; });
      var r = await corpo(def, 'STACK'), saida;
      if (r && r.retorno) saida = r.valor;
      else if (def.type === 'procedures_defreturn') saida = await val(def, 'RETURN', 0);
      modelos.forEach(function (m, k) { vars[m.getId()] = antigos[k]; });
      return saida;
    }

    async function avaliar(b) {
      var a, c;
      switch (b.type) {
        case 'math_number': return Number(b.getFieldValue('NUM'));
        case 'text': return b.getFieldValue('TEXT');
        case 'logic_boolean': return b.getFieldValue('BOOL') === 'TRUE';
        case 'variables_get': a = vars[b.getFieldValue('VAR')]; return a === undefined ? 0 : a;
        case 'math_arithmetic':
          a = await num(b, 'A', 0); c = await num(b, 'B', 0);
          switch (b.getFieldValue('OP')) { case 'ADD': return a + c; case 'MINUS': return a - c; case 'MULTIPLY': return a * c; case 'DIVIDE': return c === 0 ? 0 : a / c; default: return Math.pow(a, c); }
        case 'math_random_int': a = Math.round(await num(b, 'FROM', 0)); c = Math.round(await num(b, 'TO', 0)); if (a > c) { var t = a; a = c; c = t; } return Math.floor(Math.random() * (c - a + 1)) + a;
        case 'logic_compare':
          a = await val(b, 'A', 0); c = await val(b, 'B', 0);
          if (typeof a !== 'boolean' && typeof c !== 'boolean' && isFinite(Number(a)) && isFinite(Number(c)) && a !== '' && c !== '') { a = Number(a); c = Number(c); }
          switch (b.getFieldValue('OP')) { case 'EQ': return a === c; case 'NEQ': return a !== c; case 'LT': return a < c; case 'LTE': return a <= c; case 'GT': return a > c; default: return a >= c; }
        case 'logic_operation': a = !!(await val(b, 'A', false)); if (b.getFieldValue('OP') === 'AND') return a && !!(await val(b, 'B', false)); return a || !!(await val(b, 'B', false));
        case 'logic_negate': return !(await val(b, 'BOOL', false));
        case 'math_modulo': a = await num(b, 'DIVIDEND', 0); c = await num(b, 'DIVISOR', 1); return c === 0 ? 0 : a % c;
        case 'math_round': a = await num(b, 'NUM', 0); c = b.getFieldValue('OP'); return c === 'ROUNDUP' ? Math.ceil(a) : c === 'ROUNDDOWN' ? Math.floor(a) : Math.round(a);
        case 'math_single':
          a = await num(b, 'NUM', 0);
          switch (b.getFieldValue('OP')) { case 'ROOT': return Math.sqrt(Math.max(0, a)); case 'ABS': return Math.abs(a); case 'NEG': return -a; case 'LN': return Math.log(a); case 'LOG10': return Math.log(a) / Math.LN10; case 'EXP': return Math.exp(a); default: return Math.pow(10, a); }
        case 'procedures_callreturn': return chamar(b);
        case 'rb_cor': return R.cor(b.getFieldValue('COR'));
        case 'rb_obstaculo': return compara(R.distancia(), b.getFieldValue('COMP'), await num(b, 'VALOR', 0));
        case 'rb_distancia': return R.distancia();
        case 'rb_rgb': return R.rgb(Number(b.getFieldValue('CANAL')));
        case 'rb_cronometro': return R.cronometro();
        default: throw new Error('bloco de valor não reconhecido: ' + b.type);
      }
    }

    // executa um bloco de comando; devolve { retorno } quando um "Meu Bloco" manda voltar
    async function passo(b) {
      var f = function (n) { return b.getFieldValue(n); }, r, i, n;
      switch (b.type) {
        case 'rb_mover': return void (await R.mover(f('DIR'), await num(b, 'VALOR', 0), f('UN')));
        case 'rb_girar': return void (await R.girar(f('DIR'), await num(b, 'VALOR', 0), f('UN')));
        case 'rb_iniciar_mover': case 'rb_iniciar_girar': return void R.iniciarMover(f('DIR'), await num(b, 'VEL', 100));
        case 'rb_parar_mover': return void R.pararMover();
        case 'rb_mover_vel': return void R.moverVel(f('DIR'), await num(b, 'VALOR', 0), f('UN'), await num(b, 'VEL', 100));
        case 'rb_mover_vel_fim': return void (await R.moverVel(f('DIR'), await num(b, 'VALOR', 0), f('UN'), await num(b, 'VEL', 100)));
        case 'rb_girar_vel': return void R.girarVel(f('DIR'), await num(b, 'VALOR', 0), f('UN'), await num(b, 'VEL', 100));
        case 'rb_girar_vel_fim': return void (await R.girarVel(f('DIR'), await num(b, 'VALOR', 0), f('UN'), await num(b, 'VEL', 100)));
        case 'rb_imagem': return void R.imagem(f('IMG'));
        case 'rb_imagem_tempo': return void (await R.imagem(f('IMG'), await num(b, 'SEG', 1)));
        case 'rb_texto': return void R.texto(await val(b, 'TEXTO', ''));
        case 'rb_pixel': return void R.pixel(await num(b, 'X', 0), await num(b, 'Y', 0), await num(b, 'BRILHO', 100));
        case 'rb_apagar_tela': return void R.apagarTela();
        case 'rb_leds_cor': n = f('COR').split(','); return void R.leds(n[0], n[1], n[2]);
        case 'rb_leds_rgb': return void R.leds(await num(b, 'R', 0), await num(b, 'G', 0), await num(b, 'B', 0));
        case 'rb_leds_apagar': return void R.leds(0, 0, 0);
        case 'rb_nota': return void (await R.nota(await num(b, 'NOTA', 60), await num(b, 'BATIDAS', 0.25)));
        case 'rb_falar': return void R.falar(await val(b, 'TEXTO', ''));
        case 'rb_silencio': return void R.silencio();
        case 'rb_zerar_cronometro': return void R.zerarCronometro();
        case 'rb_esperar': return void (await R.esperar(await num(b, 'SEG', 0)));
        case 'rb_repetir':
          n = Math.round(await num(b, 'VEZES', 0));
          for (i = 0; i < n; i++) { await R.tique(); r = await corpo(b, 'FAZER'); if (r) return r; }
          return undefined;
        case 'rb_sempre': for (;;) { await R.tique(); r = await corpo(b, 'FAZER'); if (r) return r; }
        case 'rb_se': if (await val(b, 'COND', false)) return corpo(b, 'FAZER'); return undefined;
        case 'rb_se_senao': return (await val(b, 'COND', false)) ? corpo(b, 'FAZER') : corpo(b, 'SENAO');
        case 'rb_esperar_ate': while (!(await val(b, 'COND', false))) await R.tique(); return undefined;
        case 'rb_repetir_ate': while (!(await val(b, 'COND', false))) { await R.tique(); r = await corpo(b, 'FAZER'); if (r) return r; } return undefined;
        case 'rb_parar': if (f('O_QUE') === 'tudo') R.pararTudo(); else R.pararEste(); return undefined;
        case 'variables_set': vars[f('VAR')] = await val(b, 'VALUE', 0); return undefined;
        case 'math_change': vars[f('VAR')] = (Number(vars[f('VAR')]) || 0) + (await num(b, 'DELTA', 1)); return undefined;
        case 'procedures_callnoreturn': await chamar(b); return undefined;
        case 'procedures_ifreturn':
          if (await val(b, 'CONDITION', false)) return { retorno: true, valor: await val(b, 'VALUE', 0) };
          return undefined;
        default: throw new Error('bloco não reconhecido: ' + b.type);
      }
    }
    async function rodar(b) {
      while (b) {
        if (b.isEnabled()) { await R.bloco(b.id); var r = await passo(b); if (r) return r; }
        b = b.getNextBlock();
      }
      return undefined;
    }

    var pilhas = [];
    ws.getTopBlocks(true).forEach(function (b) {
      if (!CHAPEUS[b.type] || !b.isEnabled()) return;
      var cond = null;
      if (b.type === 'rb_quando_cor') cond = async function () { return R.cor(b.getFieldValue('COR')); };
      else if (b.type === 'rb_quando_obstaculo') cond = async function () { return compara(R.distancia(), b.getFieldValue('COMP'), await num(b, 'VALOR', 0)); };
      pilhas.push({ id: b.id, cond: cond, fn: function () { return rodar(b.getNextBlock()); } });
    });
    return pilhas;
  }

  /* ---------- Caixa de ferramentas ---------- */
  function num(v) { return { shadow: { type: 'math_number', fields: { NUM: v } } }; }
  function txt(v) { return { shadow: { type: 'text', fields: { TEXT: v } } }; }
  function bl(tipo, entradas) { var o = { kind: 'block', type: tipo }; if (entradas) o.inputs = entradas; return o; }
  function css(estilo) { return { row: 'blocklyToolboxCategory rvCat', icon: 'rvIcone rvI-' + estilo.replace('_category', ''), label: 'blocklyToolboxCategoryLabel rvRot' }; }
  function cat(nome, estilo, itens) { return { kind: 'category', name: nome, categorystyle: estilo, cssConfig: css(estilo), contents: itens }; }

  var CAIXA = { kind: 'categoryToolbox', contents: [
    cat('Eventos', 'evento_category', [bl('rb_quando_iniciar'), bl('rb_quando_obstaculo', { VALOR: num(20) }), bl('rb_quando_cor')]),
    cat('Movimento', 'movimento_category', [
      bl('rb_mover', { VALOR: num(10) }), bl('rb_girar', { VALOR: num(90) }),
      bl('rb_iniciar_mover', { VEL: num(100) }), bl('rb_iniciar_girar', { VEL: num(100) }), bl('rb_parar_mover'),
      bl('rb_mover_vel', { VALOR: num(10), VEL: num(100) }), bl('rb_mover_vel_fim', { VALOR: num(10), VEL: num(100) }),
      bl('rb_girar_vel', { VALOR: num(90), VEL: num(100) }), bl('rb_girar_vel_fim', { VALOR: num(90), VEL: num(100) })]),
    cat('Luz', 'luz_category', [
      bl('rb_imagem'), bl('rb_imagem_tempo', { SEG: num(2) }), bl('rb_texto', { TEXTO: txt('Olá') }),
      bl('rb_pixel', { X: num(0), Y: num(0), BRILHO: num(100) }), bl('rb_apagar_tela'),
      bl('rb_leds_cor'), bl('rb_leds_rgb', { R: num(255), G: num(0), B: num(0) }), bl('rb_leds_apagar')]),
    cat('Som', 'som_category', [bl('rb_nota', { NOTA: num(60), BATIDAS: num(0.25) }), bl('rb_falar', { TEXTO: txt('olá') }), bl('rb_silencio')]),
    cat('Sensores', 'sensor_category', [bl('rb_cor'), bl('rb_obstaculo', { VALOR: num(20) }), bl('rb_distancia'), bl('rb_rgb'), bl('rb_cronometro'), bl('rb_zerar_cronometro')]),
    cat('Controle', 'controle_category', [
      bl('rb_esperar', { SEG: num(1) }), bl('rb_repetir', { VEZES: num(10) }), bl('rb_sempre'), bl('rb_se'), bl('rb_se_senao'),
      bl('rb_esperar_ate'), bl('rb_repetir_ate'), bl('rb_parar')]),
    cat('Operadores', 'operador_category', [
      bl('math_arithmetic', { A: num(0), B: num(0) }), bl('math_random_int', { FROM: num(1), TO: num(10) }),
      bl('logic_compare', { A: num(0), B: num(50) }), bl('logic_operation'), bl('logic_negate'),
      bl('math_modulo', { DIVIDEND: num(0), DIVISOR: num(2) }), bl('math_round', { NUM: num(0) }), bl('math_single', { NUM: num(0) }), bl('math_number'), bl('text')]),
    { kind: 'category', name: 'Variáveis', categorystyle: 'variavel_category', cssConfig: css('variavel_category'), custom: 'VARIABLE' },
    { kind: 'category', name: 'Meus Blocos', categorystyle: 'meus_category', cssConfig: css('meus_category'), custom: 'PROCEDURE' }
  ] };

  function estilo(c) { return { colourPrimary: c }; }
  var TEMA = B.Theme.defineTheme('robo_virtual', {
    name: 'robo_virtual', base: B.Themes.Zelos,
    blockStyles: {
      evento_blocks: { colourPrimary: '#f2a900', hat: 'cap' }, movimento_blocks: estilo('#12a36d'), luz_blocks: estilo('#2573d9'),
      som_blocks: estilo('#14a8b8'), sensor_blocks: estilo('#3b9ee6'), controle_blocks: estilo('#ee8a11'),
      math_blocks: estilo('#3fa33a'), logic_blocks: estilo('#3fa33a'), text_blocks: estilo('#3fa33a'),
      variable_blocks: estilo('#f06a1d'), variable_dynamic_blocks: estilo('#f06a1d'), procedure_blocks: estilo('#e0457b'), loop_blocks: estilo('#ee8a11')
    },
    categoryStyles: {
      evento_category: { colour: '#f2a900' }, movimento_category: { colour: '#12a36d' }, luz_category: { colour: '#2573d9' }, som_category: { colour: '#14a8b8' },
      sensor_category: { colour: '#3b9ee6' }, controle_category: { colour: '#ee8a11' }, operador_category: { colour: '#3fa33a' },
      variavel_category: { colour: '#f06a1d' }, meus_category: { colour: '#e0457b' }
    },
    componentStyles: { workspaceBackgroundColour: '#f7fbff', toolboxBackgroundColour: '#ffffff', toolboxForegroundColour: '#333', flyoutBackgroundColour: '#eef2f6', flyoutOpacity: 1 },
    fontStyle: { family: '"Helvetica Neue", Helvetica, Arial, sans-serif', weight: 'bold', size: 12 }
  });

  window.RoboBlocos = { compilar: compilar, CAIXA: CAIXA, TEMA: TEMA, CHAPEUS: CHAPEUS };
})();
