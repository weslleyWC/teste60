# Recreio — jogos de infância

Hub de brincadeiras da infância com cards ilustrados, entrada no jogo, tela cheia e retorno à coleção. O Taco de rua é o primeiro jogo disponível; Amarelinha, Bolinha de gude e Queimada são sugestões sinalizadas como “em breve”.

Jogo web de taco com modo solo e disputa entre duas pessoas no mesmo aparelho. Cada pessoa controla uma dupla de dois personagens. Duas garrafas, corridas de 10 pontos e vitória com os tacos em X aos 100 pontos.

## Iniciar

Sem dependências ou compilação:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

A página inicial abre o hub. Clique na capa ou em **Jogar agora** no card do Taco. Use **Tela cheia** para ampliar e **Voltar ao hub** para retornar à coleção. Ao voltar, a partida fica suspensa; abrir o mesmo card retoma o placar e a partida nesta sessão. Recarregar a página inicia outra sessão. Se o navegador não permitir tela cheia, o jogo continua na janela.

Escolha modo, cor da dupla e função inicial; aplique com **Nova partida**.

## Adicionar jogos ao hub

O catálogo fica em `catalog.js`. Cada entrada tem `id` único, `title`, `category`, `description`, `cover`, `icon`, `players` e `available`. Para publicar um jogo jogável, adicione `url` apontando para sua página e marque `available: true`. Coloque a página em `games/<id>/index.html` e a capa em `assets/`. Cards com `available: false` ficam desabilitados.

`index.html`, `hub.js` e `hub.css` cuidam da coleção, navegação e tela cheia. `games/taco/index.html` contém a interface do Taco; `game.js` e `style.css` continuam na raiz para manter seus testes e caminhos estáveis. O acesso direto ao Taco é `games/taco/index.html` e a entrada pelo hub aceita `#jogar/taco`.

Para suspender um novo jogo quando estiver oculto, sua página deve tratar a mensagem `{type: 'childhoodHub:visibility', active: boolean}` enviada pelo hub, validando `event.source === window.parent` e a mesma origem. `active: false` interrompe a simulação e limpa teclas; `active: true` retoma. O Taco já implementa esse ciclo. O hub carrega os jogos apenas quando abertos.

## Mouse no PC

- Mova o mouse **sobre o campo** para mirar a rebatida ou o lançamento.
- **Clique esquerdo** rebate ou lança com a força selecionada.
- **Rodinha para cima/baixo** aumenta/diminui a força em 5 pontos, entre 20% e 100%. Vale para taco e bolinha; sobre o campo a rodinha ajusta a força sem rolar a página.
- **Clique direito** manda o personagem selecionado até um ponto.
- A rebatida permite mira em 360 graus. O traço no campo mostra a direção; a força aparece sobre o personagem e no controle.
- No modo local, escolha qual jogador usa o mouse. O outro continua com seus controles de teclado.

No toque, tocar no campo continua ajustando a mira com a bola na mão ou movendo o personagem sem a bola. Os botões direcionais e de ação continuam disponíveis.

## Movimento e jogadas

| Ação | Jogador 1 | Jogador 2 |
| --- | --- | --- |
| Movimento livre | WASD | Setas |
| Selecionar colega | Q | / |
| Rebater | Espaço | Enter |
| Carregar lançamento | Segurar Espaço e soltar | Segurar Enter e soltar |
| Mandar a dupla correr | R | L |
| Cruzar tacos aos 100 | X | K |

P pausa. C (J1) ou M (J2) sobe/desce do telhado. Os controles na tela permitem ajustar direção e força da rebatida; os botões de ação lançam usando a força escolhida. Há botões direcionais de movimento para toque.

Nos tacos, você pode mover os dois personagens manualmente, alternando o selecionado, ou mandar os dois para os círculos opostos. A dupla recebe 10 pontos quando ambos completam a troca. A posição do batedor e o tempo, a direção e a força da rebatida definem a trajetória.

Na bolinha, mova seu personagem até a bola para pegá-la. Só quem está com ela pode lançar. Com a bola na mão, mova o mouse no campo para mirar livremente ou use o botão de alvo para mirar uma garrafa. Sem a bola, o clique direito manda o personagem selecionado até um ponto. No modo local, o mouse atende ao jogador escolhido; ambas as duplas têm teclado e botões de movimento.

A bola tem velocidade, altura, quique e atrito. Não existe um cronômetro que devolve a bola automaticamente. A defesa precisa alcançar a bola. Uma garrafa só cai quando uma bola lançada passa por ela em baixa altura e nenhum batedor protege seu círculo. A bola rebatida pode ficar presa no telhado se chegar lá com altura suficiente. Isso **não dá vitória automática**: os batedores continuam correndo e pontuando até 100, depois precisam cruzar os tacos. A defesa pode usar o botão de subir (C para J1, M para J2), que leva o personagem ao local e anima a subida. Depois de recuperar, use o mesmo botão para descer; lançar do telhado é proibido.

Pegar uma bola rebatida no ar, antes do primeiro toque no chão e dentro da altura de alcance das mãos, dá vitória à dupla da bola. Pegar depois de um quique ou recuperar no telhado não conta como essa vitória.

Depois de coletar a bola, o lançador pode recuar, mas não avançar além da linha de coleta, que aparece pontilhada no campo. Essa regra vale para movimento por teclado, clique e bots. Uma nova rebatida libera a busca adiante e uma nova coleta define a próxima linha. Os bots lançam com 90–100% de força e param quando recolhem a bola. O atrito do lançamento foi reduzido para a bola conseguir atravessar a rua.

A câmera continua no mesmo lugar, com desenho em perspectiva, paredes e telhados com profundidade, sombras no chão e altura da bola/lançador projetada acima do campo. É um visual 2,5D feito em Canvas, com altura na física.

## Limites atuais

Protótipo 2D com física simplificada, solo ou duas pessoas no mesmo aparelho. Sem multiplayer online nem controle individual simultâneo de quatro pessoas. O computador move sua própria equipe; as equipes humanas têm movimento livre. Cada dupla mantém o placar ao trocar de função.

## Validação atual

Execute:

```sh
node --check game.js
node --test tests/game-rules.test.cjs
```

Os 26 testes da lógica cobrem alcance de lançamento forte, bots sem avanço entre lançamentos, bloqueio/recuo dos dois lados, coleta após nova rebatida, vitória no ar, exclusão de quiques e lançamentos normais, corrida e pontuação durante telhado, subida/descida, recuperação do bot e vitória aos 100 com X.

Também validado no Chromium: botões de subir/descer, corrida durante telhado, impedimento de lançar do alto, restrição de movimento por teclado, resultado de captura no ar, perspectiva visual e layout móvel. A regressão dos controles de mouse passou com a nova velocidade de lançamento. Ainda falta testar em celular físico.

Hub validado no Chromium: cards e capas carregados, jogos futuros desabilitados, abertura pelo card, tela cheia real e saída, volta e retomada com placar preservado/simulação suspensa, histórico do navegador, link direto, layout móvel e mensagem de alternativa quando tela cheia é recusada.

A interface do Taco agora mostra placar e botões de ajuda/configuração no topo, campo e ações antes dos ajustes de direção/força. As instruções ficam somente no diálogo “Como jogar”, que pode ser fechado; configurações ficam em um diálogo separado. Subir/descer tem botões visíveis para ambos os jogadores e se habilita para a equipe da bola quando a ação é possível.

A garrafa volta a ficar em pé imediatamente ao trocar de equipes. A velocidade da bola influencia a chance de escapar na coleta: bolas lentas são seguras; bolas rápidas têm chance de erro limitada a 55%. Se escapar no ar, não conta como vitória; a bola cai com velocidade reduzida e pode ser buscada novamente. A coleta parada no telhado continua segura. Há testes determinísticos tanto para sucesso quanto para falha dessas tentativas.

Uma rebatida da direita só pode ser recolhida pelo lançador da esquerda; uma rebatida da esquerda, só pelo da direita. O lado é registrado no momento da rebatida e continua valendo após os batedores trocarem de círculo. A restrição vale para coleta no chão, captura no ar, bola que escapou e recuperação no telhado. Os bots buscam com o lançador permitido, mesmo quando o colega está mais perto. Quatro testes adicionais cobrem a seleção do lado, coleta/captura, bloqueio na simulação e seleção do bot no chão/telhado.

## Gráficos

`visuals.js` desenha o cenário e os personagens em Canvas: telhados com textura, janelas e jardins, asfalto, luz de fim de tarde, sombras, garrafas com volume, uniformes numerados e animação de passos. A bola tem sombreamento e rastro; rebatidas e corridas geram partículas. O cenário é pré-renderizado e os efeitos têm um limite de partículas. A resolução do Canvas acompanha a tela até 2×, mantendo as coordenadas dos controles.

Os efeitos usam ruído próprio, separado da aleatoriedade de pegadas e bots. Validado no Chromium em resolução 2×: rebatida/corrida, subida e recuperação no telhado, layout móvel, ausência de erros JavaScript e preservação da aleatoriedade da lógica. Os 17 testes das regras continuam passando.

Boladas no jogador ou taco do mesmo lado do lançador são contatos acidentais, não rebatidas: não liberam corrida nem pontos. O jogador reage com um pequeno balanço, efeito de impacto e “AI!”. O lançador original pode buscar essa bola, mas precisa respeitar sua linha anterior para lançar novamente. A colisão usa o trajeto percorrido no quadro, e um lançamento reto normal continua passando pelo batedor próximo. Quatro novos testes verificam esses casos; a animação e a colisão também foram exercitadas no Chromium.

## Decisões dos bots

A defesa prevê a trajetória com os mesmos quiques, altura e atrito usados pela física. O parceiro cobre o ponto de recepção de lançamentos diagonais, enquanto quem lançou recua para cobrir seu lado. A recuperação no telhado inclui subida, coleta, descida e retorno à cobertura. Todos continuam respeitando o lado permitido de coleta e a linha de lançamento.

Com os tacos, os bots escolhem a direção da rebatida considerando a posição da defesa. Antes de correr, comparam o tempo estimado de recuperação/lançamento com o tempo necessário para trocar os círculos, incluindo uma margem de segurança. Rebatidas fracas perto da defesa não geram uma corrida automática. Se a defesa recupera a bola mais cedo, a dupla procura os círculos para se proteger.

Cinco testes novos reproduzem a sequência de telhado e lançamentos sem rebatida, recepção diagonal, proteção após rebatida fraca, corrida segura com retorno ao abrigo e isolamento da previsão em relação à bola real/aleatoriedade. Também validado no Chromium com 24 segundos de simulação após telhado, reposicionamento, decisões de corrida e renderização.

## Sons

`audio.js` gera efeitos de estilo arcade pela Web Audio API, sem arquivos externos ou downloads: lançamento, rebatida, quique, passos, bolada, garrafa caindo, coleta, bola escapando, escada, pontos e vitória. O navegador ativa o áudio após a primeira interação no jogo. O botão **Som ligado/desligado** fica no topo; o volume fica em **Configurar**. Essas preferências são salvas localmente e não reiniciam a partida. Ao voltar ao hub, os efeitos são interrompidos.

Verificado no Chromium: ausência de reprodução antes da interação, ativação por clique, sinal de áudio medido, os 11 efeitos, silenciar, volume, persistência das preferências e suspensão/retomada no hub. Os 26 testes das regras continuam passando.
