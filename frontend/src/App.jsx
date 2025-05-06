import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  CircularProgress,
  Tabs,
  Tab,
  Snackbar,
  Alert,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import axios from "axios";

axios.defaults.baseURL =
  process.env.NODE_ENV === "production" ? "http://localhost:5000" : "";

const PRIMARY = "#0D488F";
const SECONDARY = "#8EC74F";

function SentimentResult({ result }) {
  if (!result) return null;
  return (
    <Paper sx={{ p: 2, mt: 2, background: "#f8f8f8" }} elevation={2}>
      <Typography variant="h6">Resultado</Typography>
      <Typography>
        Sentimento:{" "}
        <b
          style={{
            color:
              result.label === "Positivo"
                ? SECONDARY
                : result.label === "Negativo"
                ? "#e53935"
                : "#888",
          }}
        >
          {result.label}
        </b>
      </Typography>
      <Typography>Score: {result.compound}</Typography>
    </Paper>
  );
}

export default function App() {
  const [tab, setTab] = useState(0);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", type: "error" });
  const [contact, setContact] = useState("");
  const [company, setCompany] = useState("");
  const [perception, setPerception] = useState("");
  const [errors, setErrors] = useState({ contact: false, company: false, perception: false });

  const handlePerceptionChange = (e) => {
    const val = e.target.value;
    // permitir vazio ou sinal negativo
    if (val === "" || val === "-") {
      setPerception(val);
      return;
    }
    // só números com até 2 decimais
    if (!/^-?\d+(?:\.\d{0,2})?$/.test(val)) return;
    const num = parseFloat(val);
    if (num < -1 || num > 1) return;
    setPerception(val);
  };

  const validateFields = () => {
    let valid = true;
    const newErrors = { contact: false, company: false, perception: false };
    if (!contact.trim()) { newErrors.contact = true; valid = false; }
    if (!company.trim()) { newErrors.company = true; valid = false; }
    const num = parseFloat(perception);
    if (perception.trim() === "" || isNaN(num) || num < -1 || num > 1) { newErrors.perception = true; valid = false; }
    setErrors(newErrors);
    return valid;
  };

  const handleTextAnalyze = async () => {
    if (!validateFields()) {
      setSnack({ open: true, msg: "Preencha todos os campos corretamente", type: "error" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post("/analyze/text", { text, contact, company, perception: parseFloat(perception) });
      setResult(res.data);
    } catch (e) {
      setSnack({ open: true, msg: "Erro ao analisar texto", type: "error" });
    }
    setLoading(false);
  };

  const handleFileAnalyze = async (batch = false) => {
    if (!validateFields()) {
      setSnack({ open: true, msg: "Preencha todos os campos corretamente", type: "error" });
      return;
    }
    if (!file) return;
    setLoading(true);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("contact", contact);
    formData.append("company", company);
    formData.append("perception", perception);
    try {
      if (batch) {
        const res = await axios.post("/analyze/batch", formData, {
          responseType: "blob",
        });
        // Download result
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          file.name.endsWith(".csv") ? "resultado.csv" : "resultado.xlsx"
        );
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        setSnack({
          open: true,
          msg: "Arquivo processado! Download iniciado.",
          type: "success",
        });
      } else {
        const res = await axios.post("/analyze/file", formData);
        setResult(res.data);
      }
    } catch (e) {
      setSnack({ open: true, msg: "Erro ao processar arquivo", type: "error" });
    }
    setLoading(false);
  };

  return (
    <Box minHeight="100vh" bgcolor="#fff">
      <Box bgcolor={PRIMARY} color="#fff" p={3} textAlign="center">
        <Typography variant="h4" fontWeight="bold">
          Labware Sentiment Analyzer
        </Typography>
      </Box>
      <Box display="flex" justifyContent="center" mt={4}>
        <Paper sx={{ width: 500, p: 3, borderRadius: 3 }} elevation={4}>
          <Tabs
            value={tab}
            onChange={(_, v) => {
              setTab(v);
              setResult(null);
              setFile(null);
            }}
            centered
          >
            <Tab label="Texto" />
            <Tab label="Arquivo (PDF, TXT, DOCX)" />
            <Tab label="Batch (CSV, Excel)" />
          </Tabs>
          <Box mt={2}>
            <TextField
              label="Contato"
              fullWidth
              required
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              error={errors.contact}
              helperText={errors.contact && "Contato é obrigatório"}
            />
            <TextField
              label="Empresa"
              fullWidth
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              error={errors.company}
              helperText={errors.company && "Empresa é obrigatória"}
              sx={{ mt: 2 }}
            />
            <TextField
              label="Percepção"
              fullWidth
              required
              value={perception}
              onChange={handlePerceptionChange}
              error={errors.perception}
              helperText={errors.perception && "Percepção inválida (-1 a 1, até 2 casas decimais)"}
              sx={{ mt: 2 }}
            />
          </Box>
          {tab === 0 && (
            <Box mt={2}>
              <TextField
                label="Digite ou cole o texto"
                multiline
                minRows={4}
                fullWidth
                value={text}
                onChange={(e) => setText(e.target.value)}
                variant="outlined"
              />
              <Button
                variant="contained"
                sx={{
                  mt: 2,
                  bgcolor: PRIMARY,
                  "&:hover": { bgcolor: SECONDARY, color: "#fff" },
                }}
                onClick={handleTextAnalyze}
                disabled={loading || !text.trim()}
                fullWidth
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : (
                  "Analisar Sentimento"
                )}
              </Button>
            </Box>
          )}
          {tab === 1 && (
            <Box mt={2}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadFileIcon />}
                sx={{
                  borderColor: PRIMARY,
                  color: PRIMARY,
                  "&:hover": { borderColor: SECONDARY, color: SECONDARY },
                }}
                fullWidth
              >
                {file ? file.name : "Selecionar Arquivo"}
                <input
                  type="file"
                  accept=".pdf,.txt,.docx"
                  hidden
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </Button>
              <Button
                variant="contained"
                sx={{
                  mt: 2,
                  bgcolor: PRIMARY,
                  "&:hover": { bgcolor: SECONDARY, color: "#fff" },
                }}
                onClick={() => handleFileAnalyze(false)}
                disabled={loading || !file}
                fullWidth
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : (
                  "Analisar Sentimento"
                )}
              </Button>
            </Box>
          )}
          {tab === 2 && (
            <Box mt={2}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadFileIcon />}
                sx={{
                  borderColor: PRIMARY,
                  color: PRIMARY,
                  "&:hover": { borderColor: SECONDARY, color: SECONDARY },
                }}
                fullWidth
              >
                {file ? file.name : "Selecionar CSV ou Excel"}
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  hidden
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </Button>
              <Button
                variant="contained"
                sx={{
                  mt: 2,
                  bgcolor: PRIMARY,
                  "&:hover": { bgcolor: SECONDARY, color: "#fff" },
                }}
                onClick={() => handleFileAnalyze(true)}
                disabled={loading || !file}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : "Processar Batch"}
              </Button>
            </Box>
          )}
          <SentimentResult result={result} />
        </Paper>
      </Box>
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert
          onClose={() => setSnack({ ...snack, open: false })}
          severity={snack.type}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
