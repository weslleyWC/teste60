# Taco de rua

Jogo web em português inspirado no taco: modo solo contra o computador ou dois jogadores no mesmo aparelho, duas garrafas, rebatidas, corridas de 10 pontos, troca de funções e vitória com os tacos em X aos 100 pontos. Inclui a regra especial da bola presa no telhado.

## Jogar

Sem dependências ou compilação. Na pasta do projeto:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Abra o endereço do servidor no navegador. Espaço rebate ou lança; R inicia uma troca; X finaliza aos 100 pontos; V reivindica a vitória quando a bola fica no telhado. Também há botões na tela. “Como jogar” explica as regras e pausa a partida.

## Segunda fase

Seleção de dupla e função inicial, pausa (P), escolha de alvo (A) e lançamento animado com tempo de viagem. A proteção é verificada quando a bola chega à garrafa. O aviso de perigo e os círculos indicam quando os tacos estão fora das bases. A dupla adversária também vai ao meio para concluir sua vitória.

## Terceira fase: jogar junto

Selecione “2 jogadores no mesmo aparelho” e clique em “Nova partida”. Cada pessoa controla uma dupla de dois personagens. Os controles permanecem ligados ao jogador quando as duplas trocam de função:

| Ação | Jogador 1 | Jogador 2 |
| --- | --- | --- |
| Rebater / lançar | Espaço | Enter |
| Correr | R | L |
| Cruzar tacos | X | K |
| Escolher alvo | A | J |

P pausa; V reivindica a vitória especial da dupla com os tacos. Há botões para ambos os jogadores. No modo local a dupla lançadora decide quando lançar; depois de uma rebatida, precisa esperar a busca da bola antes de tentar derrubar uma garrafa. O resultado mostra placar, rebatidas, trocas de função e oferece revanche. Se mudar as opções, aplique-as com “Nova partida”.

## Escopo

Protótipo com modo solo e disputa local entre duas pessoas. A física e as decisões dos adversários são simplificadas; ainda não há modo para quatro jogadores nem multiplayer online. Cada dupla mantém os pontos quando troca de função.

## Verificação

`node --check game.js` verifica a sintaxe. A lógica de rebatida, pontos, troca de funções e vitórias foi exercitada com um DOM simulado; A segunda fase foi validada também no Chromium: seleção de dupla/função, pausa, lançamento com tempo de viagem, proteção de garrafa, pontos, vitória com X, diálogo de regras e ausência de transbordamento em tela de 390 px. Capturas da tela móvel foram inspecionadas. Ainda falta testar em um celular físico.

A terceira fase foi validada no Chromium com comandos de teclado dos dois jogadores, pontuação de ambas as duplas, lançamento atrasado, troca de funções, garrafa protegida, vitória com X e no telhado, revanche, pausa, layout móvel e regressão do modo solo.
