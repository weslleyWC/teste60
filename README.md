# Taco de rua

Jogo web de taco com modo solo e disputa entre duas pessoas no mesmo aparelho. Cada pessoa controla uma dupla de dois personagens. Duas garrafas, corridas de 10 pontos e vitória com os tacos em X aos 100 pontos.

## Iniciar

Sem dependências ou compilação:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Escolha modo, cor da dupla e função inicial; aplique com **Nova partida**.

## Movimento e jogadas

| Ação | Jogador 1 | Jogador 2 |
| --- | --- | --- |
| Movimento livre | WASD | Setas |
| Selecionar colega | Q | / |
| Rebater | Espaço | Enter |
| Carregar lançamento | Segurar Espaço e soltar | Segurar Enter e soltar |
| Mandar a dupla correr | R | L |
| Cruzar tacos aos 100 | X | K |

P pausa. V reivindica a vitória da dupla dos tacos quando a bola fica no telhado. Os controles na tela permitem ajustar direção e força da rebatida; os botões de ação lançam usando a força escolhida. Há botões direcionais de movimento para toque.

Nos tacos, você pode mover os dois personagens manualmente, alternando o selecionado, ou mandar os dois para os círculos opostos. A dupla recebe 10 pontos quando ambos completam a troca. A posição do batedor e o tempo, a direção e a força da rebatida definem a trajetória.

Na bolinha, mova seu personagem até a bola para pegá-la. Só quem está com ela pode lançar. Com a bola na mão, clique no campo para mirar livremente ou use o botão de alvo para mirar uma garrafa. Sem a bola, o clique manda o personagem selecionado até um ponto. No modo local, o clique atende à dupla da bolinha; ambas as duplas têm teclado e botões de movimento.

A bola tem velocidade, altura, quique e atrito. Não existe um cronômetro que devolve a bola automaticamente. A defesa precisa alcançar a bola. Uma garrafa só cai quando uma bola lançada passa por ela em baixa altura e nenhum batedor protege seu círculo. A bola rebatida pode ficar presa no telhado se chegar lá com altura suficiente.

## Limites atuais

Protótipo 2D com física simplificada, solo ou duas pessoas no mesmo aparelho. Sem multiplayer online nem controle individual simultâneo de quatro pessoas. O computador move sua própria equipe; as equipes humanas têm movimento livre. Cada dupla mantém o placar ao trocar de função.

## Validação

`node --check game.js` verifica a sintaxe. Validado no Chromium: movimento por teclado, exposição da garrafa, lançamento carregado, direções e forças diferentes de rebatida, coleta manual, colisão e proteção de garrafas, pontuação sem duplicação, vitória no telhado, vitória com X, mira livre no solo e layout de 390 px. Ainda falta testar em celular físico.
