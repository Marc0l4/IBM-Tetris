# CyberPulse Tetris 🎮

Jogo estilo Tetris com estética dark/neon, desenvolvido em HTML, CSS e JavaScript puro — sem dependências externas.

---

## 🚀 Como executar

Abra diretamente no navegador (sem servidor necessário):

```
cyberpulse/index.html
```

Ou via terminal:

```bash
# macOS / Linux
open cyberpulse/index.html

# Windows
start cyberpulse/index.html
```

> ✅ Funciona com `file://` — zero dependências externas.

---

## 🕹️ Controles

| Tecla | Ação |
|---|---|
| `←` / `→` | Mover a peça |
| `↓` | Acelerar a queda |
| `Espaço` ou `↑` | Girar a peça |
| `Enter` | Iniciar / Reiniciar o jogo |
| Swipe (mobile) | Mover e girar por toque |

---

## 📁 Estrutura

```
cyberpulse/
├── index.html   ← Canvas do jogo, painéis de score e controles
├── styles.css   ← Layout dark/neon, painéis laterais, overlay
├── app.js       ← Engine completo do Tetris
└── README.md    ← Este arquivo
```

---

## ✨ Funcionalidades

- **7 tetrominós** com cores neon individuais (I, O, T, S, Z, J, L)
- **Ghost piece** — sombra translúcida mostrando onde a peça vai cair
- **Rotação com wall kicks** — não trava na parede lateral
- **Sistema de pontuação** — 100 / 300 / 500 / 800 pts por 1–4 linhas × nível
- **Nível progressivo** — velocidade aumenta a cada 10 linhas
- **Preview** da próxima peça no painel lateral
- **Tela de Game Over** com pontuação, nível e linhas finais
- **Suporte a toque** (swipe) para dispositivos móveis

---

## 📊 Sistema de Pontuação

| Linhas limpas | Pontos (× nível) |
|---|---|
| 1 linha | 100 |
| 2 linhas | 300 |
| 3 linhas | 500 |
| 4 linhas (Tetris) | 800 |

A velocidade de queda aumenta a cada 10 linhas acumuladas, com mínimo de 100ms por drop.
