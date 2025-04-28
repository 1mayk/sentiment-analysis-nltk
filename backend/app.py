from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import nltk
from preprocess import preprocess_text
from nltk.sentiment.vader import SentimentIntensityAnalyzer
import pandas as pd
import os
from io import BytesIO, StringIO
from werkzeug.utils import secure_filename
import docx
import PyPDF2
import requests
import csv

nltk.download('vader_lexicon')

# Baixar lexicon VADER-PT-BR se não existir
VADER_PT_URL = 'https://raw.githubusercontent.com/rafjaa/LeIA/master/lexicons/vader_lexicon_ptbr.txt'
VADER_PT_PATH = os.path.join(os.path.expanduser('~'), 'nltk_data', 'sentiment', 'vader_lexicon_ptbr.txt')
os.makedirs(os.path.dirname(VADER_PT_PATH), exist_ok=True)

lexicon_ok = False
try:
    r = requests.get(VADER_PT_URL, timeout=10)
    if r.status_code == 200 and 'negativo' in r.text.lower():
        with open(VADER_PT_PATH, 'w', encoding='utf-8') as f:
            f.write(r.text)
        lexicon_ok = True
        print("Léxico PT-BR baixado com sucesso.")
    else:
        print("Falha ao baixar o léxico PT-BR ou conteúdo inesperado.")
except Exception as e:
    print(f"Erro ao tentar baixar léxico PT-BR: {e}")

class SentimentIntensityAnalyzerPT(SentimentIntensityAnalyzer):
    def __init__(self):
        super().__init__()
        if os.path.exists(VADER_PT_PATH):
            print("Mesclando léxico PT-BR ao léxico padrão.")
            with open(VADER_PT_PATH, encoding="utf-8") as f:
                for line in f:
                    if not line.strip() or line.startswith('#'):
                        continue
                    word, score = line.strip().split('\t')[:2]
                    self.lexicon[word] = float(score)

sia = SentimentIntensityAnalyzerPT()

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Utilitário para analisar sentimento

def analyze_text(text):
    # pré-processamento do texto
    text = preprocess_text(text)
    scores = sia.polarity_scores(text)
    if scores['compound'] >= 0.05:
        label = 'Positivo'
    elif scores['compound'] <= -0.05:
        label = 'Negativo'
    else:
        label = 'Neutro'
    return {**scores, 'label': label}

# Rota para texto direto
@app.route('/analyze/text', methods=['POST'])
def analyze_text_route():
    data = request.json
    text = data.get('text', '')
    result = analyze_text(text)
    return jsonify(result)

# Rota para upload de arquivo
@app.route('/analyze/file', methods=['POST'])
def analyze_file_route():
    file = request.files['file']
    filename = secure_filename(file.filename)
    ext = os.path.splitext(filename)[1].lower()
    content = ''
    if ext == '.txt':
        content = file.read().decode('utf-8')
    elif ext == '.docx':
        doc = docx.Document(file)
        content = '\n'.join([p.text for p in doc.paragraphs])
    elif ext == '.pdf':
        reader = PyPDF2.PdfReader(file)
        content = '\n'.join([page.extract_text() or '' for page in reader.pages])
    else:
        return jsonify({'error': 'Formato não suportado'}), 400
    result = analyze_text(content)
    return jsonify(result)

# Rota para análise batch (CSV/Excel)
@app.route('/analyze/batch', methods=['POST'])
def analyze_batch_route():
    file = request.files['file']
    filename = secure_filename(file.filename)
    ext = os.path.splitext(filename)[1].lower()
    if ext in ['.csv', '.xlsx']:
        if ext == '.csv':
            # Usa csv.reader para parsing robusto de uma coluna 'texto'
            raw = file.read().decode('utf-8', errors='ignore')
            f = StringIO(raw)
            reader = csv.reader(f, skipinitialspace=True)
            rows = list(reader)
            if not rows:
                return jsonify({'error': 'CSV vazio'}), 400
            # Remove cabeçalho se for 'texto'
            if rows[0] and rows[0][0].strip().lower() == 'texto':
                rows = rows[1:]
            # Extrai primeira coluna como texto
            data = [row[0] for row in rows if row]
            df = pd.DataFrame({'texto': data})
        else:
            df = pd.read_excel(file)
        if 'texto' not in df.columns:
            return jsonify({'error': 'Arquivo deve conter coluna "texto"'}), 400
        df_result = df.copy()
        df_result['texto'] = df_result['texto'].astype(str)
        df_result['sentimento'] = df_result['texto'].apply(lambda t: analyze_text(t)['label'])
        df_result['compound'] = df_result['texto'].apply(lambda t: analyze_text(t)['compound'])
        if ext == '.csv':
            output = BytesIO()
            df_result.to_csv(output, index=False, encoding='utf-8')
            output.seek(0)
            return send_file(
                output,
                mimetype="text/csv",
                as_attachment=True,
                download_name="resultado.csv"
            )
        else:
            output = BytesIO()
            df_result.to_excel(output, index=False)
            output.seek(0)
            return send_file(
                output,
                mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                as_attachment=True,
                download_name="resultado.xlsx"
            )
    return jsonify({'error': 'Formato não suportado para batch'}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
