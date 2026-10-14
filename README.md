# Taco de rua

Jogo web de taco com modo solo e disputa entre duas pessoas no mesmo aparelho. Cada pessoa controla uma dupla de dois personagens. Duas garrafas, corridas de 10 pontos e vitória com os tacos em X aos 100 pontos.

## Iniciar

Sem dependências ou compilação:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Escolha modo, cor da dupla e função inicial; aplique com **Nova partida**.

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

Os 10 testes da lógica cobrem alcance de lançamento forte, bots sem avanço entre lançamentos, bloqueio/recuo dos dois lados, coleta após nova rebatida, vitória no ar, exclusão de quiques e lançamentos normais, corrida e pontuação durante telhado, subida/descida, recuperação do bot e vitória aos 100 com X.

Também validado no Chromium: botões de subir/descer, corrida durante telhado, impedimento de lançar do alto, restrição de movimento por teclado, resultado de captura no ar, perspectiva visual e layout móvel. A regressão dos controles de mouse passou com a nova velocidade de lançamento. Ainda falta testar em celular físico.
