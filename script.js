<script>
(function(){
  const appEl  = document.getElementById('gameApp');
  const lane   = document.getElementById('lane');
  const tpl    = document.getElementById('cardTpl');

  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');

  // HUD
  const scoreEl = document.getElementById('score');
  const accEl   = document.getElementById('accuracy');
  const missEl  = document.getElementById('misses');
  const reachEl = document.getElementById('reach');
  const propBar = document.getElementById('propBar');
  const propLbl = document.getElementById('propLabel');

  // Itens de teste
  const ITEMS = [
  //  Conteúdos perigosos
  { t: "Passatempo relâmpago: ganha um iPhone se preencheres este formulário!", d: true },
  { t: "Vídeo mostra político a admitir fraude nas eleições (deepfake).", d: true },
  { t: "Nova criptomoeda vai multiplicar o valor por 100 vezes numa semana, compra já!", d: true },
  { t: "Bug no casino online: aposta sempre no vermelho e ganha garantido!", d: true },
  { t: "Partilha esta publicação e recebe 500€ imediatamente!", d: true },
  { t: "Oferta exclusiva: envia 0,01 BTC e recebe 0,1 BTC de volta!", d: true },
  { t: "Nova vacina provoca doenças raras, vê as provas aqui!", d: true },
  { t: "Investimento secreto usado por milionários – inscreve-te já!", d: true },
  { t: "Grupo privado no Telegram com dicas 100% seguras para ganhar nas apostas!", d: true },
  { t: "Este truque caseiro cura qualquer dor em poucos segundos!", d: true },
  { t: "Bug descoberto no multibanco permite levantar dinheiro ilimitado!", d: true },
  { t: "Promoção imperdível! Instala esta aplicação e ganha saldo grátis!", d: true },
  { t: "Atenção! Governo vai bloquear contas bancárias amanhã, transfere já o teu dinheiro!", d: true },
  { t: "Partilha este link para ajudar uma criança que precisa urgentemente de uma cirurgia!", d: true },
  { t: "Apostas desportivas com resultados garantidos a 100%! Junta-te já!", d: true },

  //  Conteúdos seguros
  { t: "Nova loja no bairro partilha horários e localização.", d: false },
  { t: "Artigo de jornal fiável sobre segurança digital.", d: false },
  { t: "Receita tradicional de bolo de chocolate passo a passo.", d: false },
  { t: "Evento cultural gratuito na tua cidade este fim de semana.", d: false },
  { t: "Dicas para melhorar a produtividade no trabalho remoto.", d: false },
  { t: "Campanha de recolha de alimentos para famílias carenciadas.", d: false },
  { t: "Guia para configurar autenticação de dois fatores (2FA).", d: false },
  { t: "Artigo sobre os benefícios de uma boa noite de sono.", d: false },
  { t: "Sugestões de livros para ler nas férias.", d: false },
  { t: "Nova atualização do teu jogo favorito com melhorias.", d: false },
  { t: "Lista de aplicações recomendadas para aprender línguas.", d: false },
  { t: "Notícia sobre a previsão do tempo para os próximos dias.", d: false },
  { t: "Guia de segurança para compras online.", d: false },
  { t: "Informações sobre vacinas disponíveis no centro de saúde local.", d: false },
  { t: "Anúncio de novas linhas de transporte público na cidade.", d: false }
];
  // Estado
  let running = false;
  let paused = false;
  let spawnTimer = null;
  let lastSpawnAt = 0;

  let score = 0;
  let correct = 0;
  let total = 0;
  let misses = 0;
  let propagation = 0; // 0 a 100
  let reach = 0;
  let algoBoost = 1;

  // Configuração do jogo
  const BASE_DURATION = 12000; // Velocidade das cartas (ms)
  const MIN_GAP_MS = 4500;     // Tempo mínimo entre novas cartas
  const MAX_CARDS = 2;         // Máximo de cartas em simultâneo

  // Eventos
  startBtn.addEventListener('click', start);
  pauseBtn.addEventListener('click', togglePause);
  resetBtn.addEventListener('click', reset);
  window.addEventListener('keydown', onKey);

  // Inicia o jogo /
  function start(){
    if(running) return;
    running = true;
    paused = false;
    lastSpawnAt = 0;
    appEl.classList.remove('paused');
    tickSpawn();
    spawnTimer = setInterval(tickSpawn, 200);
    updateHUD();
  }

  //Pausa ou retoma /
  function togglePause(){
    if(!running) return;
    paused = !paused;
    appEl.classList.toggle('paused', paused);
  }

  // Reinicia /
  function reset(){
    running = false;
    paused = false;
    lastSpawnAt = 0;
    appEl.classList.remove('paused');

    if(spawnTimer){
      clearInterval(spawnTimer);
      spawnTimer = null;
    }

    if(lane) lane.innerHTML = '';

    score = 0;
    correct = 0;
    total = 0;
    misses = 0;
    propagation = 0;
    reach = 0;
    algoBoost = 1;
    updateHUD();
  }

  // Verifica se pode lançar nova carta /
  function tickSpawn(){
    if(!running || paused) return;
    if(lane.childElementCount >= MAX_CARDS) return;

    const now = Date.now();
    if(now - lastSpawnAt < MIN_GAP_MS) return;

    spawnCard();
    lastSpawnAt = now;
  }

  // Cria uma nova carta /
  function spawnCard(){
    const data = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    const node = tpl.content.firstElementChild.cloneNode(true);

    node.querySelector('.text').textContent = data.t;
    node.classList.add(data.d ? 'danger' : 'safe');
    node.dataset.dangerous = data.d ? 'true' : 'false';
    node.style.animationDuration = BASE_DURATION + 'ms';

    // Eventos dos botões
    node.querySelector('.act.block').addEventListener('click', (e) => {
      e.stopPropagation();
      resolve(node, 'block');
    });

    node.querySelector('.act.allow').addEventListener('click', (e) => {
      e.stopPropagation();
      resolve(node, 'allow');
    });

    // Quando chega ao fundo sem ação → permitir automaticamente
    node.addEventListener('animationend', () => resolve(node, 'allow'));

    lane.appendChild(node);
  }

  // Resolve a ação sobre a carta /
  function resolve(node, action){
    if(node.dataset.resolved === '1') return;
    node.dataset.resolved = '1';
    total++;

    const isDanger = node.dataset.dangerous === 'true';
    let delta = 0;

    if(action === 'block'){
      if(isDanger){
        correct++;
        delta = +100;
        propagation = Math.max(0, propagation - 2);
      } else {
        delta = -50;
      }
    } else {
      if(isDanger){
        delta = -100;
        misses++;

        // Propagação aumenta entre 14% e 20%
        const bump = 14 + Math.floor(Math.random() * 7);
        propagation = Math.min(100, propagation + bump);

        // Alcance cresce exponencialmente
        const reached = Math.round((5000 + Math.random() * 7000) * algoBoost);
        reach += reached;
        algoBoost = Math.min(6, +(algoBoost * 1.14).toFixed(2));
      } else {
        correct++;
        delta = +50;
      }
    }

    score += delta;

    // Animação de saída
    node.style.transition = 'transform .18s ease, opacity .18s ease';
    node.style.transform  = 'translateY(-12px) scale(.98)';
    node.style.opacity    = '.2';
    setTimeout(() => node.remove(), 180);

    updateHUD();

    if(propagation >= 100){
      gameOver();
    }
  }

  // Atualiza os números no HUD /
  function updateHUD(){
    scoreEl.textContent = String(score);
    const acc = total ? Math.round((correct / total) * 100) : 0;
    accEl.textContent = total ? acc + '%' : '—';
    missEl.textContent = String(misses);
    reachEl.textContent = reach.toLocaleString('pt-PT');
    propBar.style.width = Math.min(100, propagation) + '%';
    propLbl.textContent = Math.min(100, propagation) + '%';
  }

  // Fim do jogo /
  function gameOver(){
    running = false;
    if(spawnTimer){
      clearInterval(spawnTimer);
      spawnTimer = null;
    }
    alert(`O algoritmo venceu! Pontuação: ${score} | Precisão: ${accEl.textContent}`);
  }

  // Controlo via teclado /
  function onKey(e){
    if(!running || paused) return;
    const card = lane.querySelector('.card');
    if(!card) return;

    if(e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft'){
      card.querySelector('.act.block')?.click();
    }

    if(e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight'){
      card.querySelector('.act.allow')?.click();
    }
  }
})();
</script>
