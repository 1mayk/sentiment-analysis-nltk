import nltk
import pandas as pd
import os
import docx
import PyPDF2
import requests
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from preprocess import preprocess_text
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from io import BytesIO
from werkzeug.utils import secure_filename

nltk.download("vader_lexicon")

# ... download vader lexicon PT-BR
VADER_PT_URL = "https://raw.githubusercontent.com/rafjaa/LeIA/master/lexicons/vader_lexicon_ptbr.txt"
VADER_PT_PATH = os.path.join(
    os.path.expanduser("~"), "nltk_data", "sentiment", "vader_lexicon_ptbr.txt"
)

# ... create directory for vader lexicon PT-BR
os.makedirs(os.path.dirname(VADER_PT_PATH), exist_ok=True)


lexicon_ok = False
try:
    r = requests.get(VADER_PT_URL, timeout=10)
    if r.status_code == 200 and "negativo" in r.text.lower():
        with open(VADER_PT_PATH, "w", encoding="utf-8") as f:
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
            with open(VADER_PT_PATH, encoding="utf-8") as f:
                for line in f:
                    if not line.strip() or line.startswith("#"):
                        continue
                    word, score = line.strip().split("\t")[:2]
                    self.lexicon[word] = float(score)


sia = SentimentIntensityAnalyzerPT()

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

DOWNLOADS_FOLDER = os.path.join(os.path.expanduser("~"), "Downloads")
DB_FILE = os.path.join(DOWNLOADS_FOLDER, "sentiment_db.xlsx")

def append_records(records):
    os.makedirs(DOWNLOADS_FOLDER, exist_ok=True)
    if os.path.exists(DB_FILE):
        df_old = pd.read_excel(DB_FILE, engine="openpyxl")
        max_id = int(df_old["ID"].max()) if not df_old.empty else 0
        df_new = pd.DataFrame(records)
        df_new["ID"] = range(max_id+1, max_id+1+len(df_new))
        df_all = pd.concat([df_old, df_new], ignore_index=True)
    else:
        df_new = pd.DataFrame(records)
        df_new["ID"] = range(1, len(df_new)+1)
        df_all = df_new
    cols = ["ID", "Empresa", "Contato", "Texto", "Percepção", "Sentimento", "Score"]
    df_all = df_all[cols]
    df_all.to_excel(DB_FILE, index=False, engine="openpyxl")

# Utilitário para analisar sentimento
def analyze_text(text, company=None, contact=None, perception=None):
    # pré-processamento do texto
    text = preprocess_text(text)
    scores = sia.polarity_scores(text)
    if scores["compound"] >= 0.05:
        label = "Positivo"
    elif scores["compound"] <= -0.05:
        label = "Negativo"
    else:
        label = "Neutro"
    result = {**scores, "label": label}
    # registra em DB se parâmetros informados
    if company is not None and contact is not None and perception is not None:
        append_records([
            {"Empresa": company, "Contato": contact, "Texto": text, "Percepção": perception, "Sentimento": result["label"], "Score": result["compound"]}
        ])
    return result

def get_extension(filename):
    return os.path.splitext(secure_filename(filename))[1].lower()

def extract_text(file):
    ext = get_extension(file.filename)
    loaders = {
        '.txt': lambda f: f.read().decode('utf-8'),
        '.docx': lambda f: '\n'.join(p.text for p in docx.Document(f).paragraphs),
        '.pdf': lambda f: '\n'.join(page.extract_text() or '' for page in PyPDF2.PdfReader(f).pages)
    }
    if ext in loaders:
        return loaders[ext](file)
    raise ValueError("Formato não suportado")

def read_dataframe(file):
    ext = get_extension(file.filename)
    if ext == '.csv':
        return pd.read_csv(file, encoding='utf-8', dtype=str, usecols=['texto'])
    elif ext == '.xlsx':
        return pd.read_excel(file, usecols=['texto'], dtype=str)
    raise ValueError("Formato não suportado para batch")

def send_dataframe(df, ext):
    output = BytesIO()
    if ext == '.csv':
        df.to_csv(output, index=False, encoding='utf-8')
        mimetype = 'text/csv'; name = 'resultado.csv'
    else:
        df.to_excel(output, index=False)
        mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; name = 'resultado.xlsx'
    output.seek(0)
    return send_file(output, mimetype=mimetype, as_attachment=True, download_name=name)

# ... plain text
@app.route("/analyze/text", methods=["POST"])
def analyze_text_route():
    data = request.json
    text = data.get("text", "")
    contact = data.get("contact", "")
    company = data.get("company", "")
    perception = data.get("perception", 0)
    result = analyze_text(text, company, contact, perception)
    return jsonify(result)

# ... upload file
@app.route("/analyze/file", methods=["POST"])
def analyze_file_route():
    file = request.files["file"]
    contact = request.form.get("contact", "")
    company = request.form.get("company", "")
    perception = request.form.get("perception", 0)
    try:
        content = extract_text(file)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    result = analyze_text(content, company, contact, perception)
    return jsonify(result)

# ... batch analysis (CSV/Excel)
@app.route("/analyze/batch", methods=["POST"])
def analyze_batch_route():
    file = request.files["file"]
    contact = request.form.get("contact", "")
    company = request.form.get("company", "")
    perception = request.form.get("perception", 0)
    try:
        df = read_dataframe(file)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    df_result = df.copy()
    results = df_result["texto"].apply(lambda t: analyze_text(t, company, contact, perception))
    df_result["sentimento"] = results.apply(lambda r: r["label"])
    df_result["compound"] = results.apply(lambda r: r["compound"])
    ext = get_extension(file.filename)
    return send_dataframe(df_result, ext)

if __name__ == "__main__":
    app.run(debug=True, port=5000)