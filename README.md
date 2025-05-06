# Labware Sentiment Analyzer

Projeto de análise de sentimentos com backend em Python (NLTK + VADER), frontend em React (Vite + MUI) e desktop com Electron.

## Funcionalidades

- Análise de texto a partir de input manual.
- Upload e análise de arquivos (.txt, .pdf, .docx).
- Análise em lote de arquivos CSV e Excel (coluna `texto`).
- Download automático dos resultados batch (CSV/Excel).
- Registro em banco local (`sentiment_db.xlsx` em ~/Downloads) com colunas: ID, Empresa, Contato, Texto, Percepção, Score.
- Aplicativo desktop para Windows com instalador NSIS via Electron Builder.

## Como rodar

### Backend (Desenvolvimento)
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Backend (Produção)
```bash
cd electron
npm install
npm run build-backend
# Executável gerado em electron/backend/dist/backend(.exe)
```

### Frontend
- Desenvolvimento:
```bash
cd frontend
npm install
npm run dev
```
- Produção:
```bash
cd frontend
npm install
npm run build
npm run preview
```

### Electron
- Desenvolvimento:
```bash
cd electron
npm install
npm run start
```
- Produção e instalador:
```bash
cd electron
npm install
npm run build      # compila backend, frontend e copia frontend
npm run dist       # gera instalador em 'release'
```

## Batch CSV/Excel

Arquivo deve conter coluna `texto`; retorna as colunas originais + `sentimento` e `compound`.

---

Cores principais:
- Principal: #0D488F
- Secundária: #8EC74F
