import nltk
import string
import re
from nltk.tokenize import RegexpTokenizer
from nltk.corpus import stopwords

nltk.download("stopwords")

tokenizer = RegexpTokenizer(r"\w+")


def preprocess_text(text):
    """
    Pré-processa o texto:
      - Converte para minúsculas
      - Remove URLs
      - Remove pontuação
      - Tokeniza o texto
      - Remove stopwords
    Retorna o texto processado.
    """
    # Converte para minúsculas
    text = text.lower()

    # Remove URLs
    # text = re.sub(r"http\\S+", "", text)
    text = re.sub(r"https?://\S+", "", text)

    # Remove pontuações
    text = text.translate(str.maketrans("", "", string.punctuation))

    # Tokenização (usando padrão, sem language)
    tokens = tokenizer.tokenize(text)

    # Remove stopwords
    stop_words = set(stopwords.words("portuguese")) - {
        "não", "nem", "jamais", "tampouco", "muito", "bastante", "mais", "menos", "mas", "porém"
    }
    tokens = [word for word in tokens if word not in stop_words]

    # Junta de volta em string
    processed = " ".join(tokens)

    return processed
