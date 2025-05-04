# Labware Sentiment Analyzer

Projeto de análise de sentimentos com backend em Python (NLTK + VADER), frontend (Vite + React), pronto para Electron.

## Como rodar

### Backend
1. `cd backend`
2. `pip install -r requirements.txt`
3. `python app.py`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

### Electron
1. `cd electron`
2. `npm install`
3. `npm start` (após backend e frontend estarem rodando)

## Formato de arquivo batch (CSV/Excel)
Para a análise em lote, o arquivo deve conter uma coluna obrigatória chamada **texto**, com os conteúdos a serem analisados. O backend processa essa coluna e retorna um arquivo com as colunas originais mais duas colunas:
- **sentimento**: rótulo do sentimento (Positivo, Neutro, Negativo)
- **compound**: pontuação numérica de -1 a 1

## Funcionalidades
- Input de texto
- Upload de PDF, TXT, DOCX
- Processamento em lote: CSV, Excel
- Download automático dos resultados batch

## Gerar executável
1. `cd electron`
2. `npm install`
3. `npm run build`
4. `npm run make`
O instalador será gerado em `out/make`, pronto para distribuição.

### Local do Arquivo Instalado

    C:\Users\<nome_do_usuario>\AppData\Local\Programs\

### Local dos Downloads dos Lexicons

    C:\Users\<nome_do_usuario>\AppData\Roaming\

---
Cores principais:
- Principal: #0D488F
- Secundária: #8EC74F
