import React, { useState } from 'react';
import { Box, Typography, Button, TextField, Paper, CircularProgress, Tabs, Tab, Snackbar, Alert } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import axios from 'axios';

const PRIMARY = '#0D488F';
const SECONDARY = '#8EC74F';

function SentimentResult({ result }) {
  if (!result) return null;
  return (
    <Paper sx={{ p: 2, mt: 2, background: '#f8f8f8' }} elevation={2}>
      <Typography variant="h6">Resultado</Typography>
      <Typography>Sentimento: <b style={{ color: result.label === 'Positivo' ? SECONDARY : result.label === 'Negativo' ? '#e53935' : '#888' }}>{result.label}</b></Typography>
      <Typography>Score: {result.compound}</Typography>
    </Paper>
  );
}

export default function App() {
  const [tab, setTab] = useState(0);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', type: 'error' });

  const handleTextAnalyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post('/analyze/text', { text });
      setResult(res.data);
    } catch (e) {
      setSnack({ open: true, msg: 'Erro ao analisar texto', type: 'error' });
    }
    setLoading(false);
  };

  const handleFileAnalyze = async (batch = false) => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      if (batch) {
        const res = await axios.post('/analyze/batch', formData, { responseType: 'blob' });
        // Download result
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', file.name.endsWith('.csv') ? 'resultado.csv' : 'resultado.xlsx');
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        setSnack({ open: true, msg: 'Arquivo processado! Download iniciado.', type: 'success' });
      } else {
        const res = await axios.post('/analyze/file', formData);
        setResult(res.data);
      }
    } catch (e) {
      setSnack({ open: true, msg: 'Erro ao processar arquivo', type: 'error' });
    }
    setLoading(false);
  };

  return (
    <Box minHeight="100vh" bgcolor="#fff">
      <Box bgcolor={PRIMARY} color="#fff" p={3} textAlign="center">
        <Typography variant="h4" fontWeight="bold">Labware Sentiment Analyzer</Typography>
        <Typography>Analise sentimentos em textos e arquivos de clientes de forma rápida e intuitiva.</Typography>
      </Box>
      <Box display="flex" justifyContent="center" mt={4}>
        <Paper sx={{ width: 500, p: 3, borderRadius: 3 }} elevation={4}>
          <Tabs value={tab} onChange={(_, v) => { setTab(v); setResult(null); }} centered>
            <Tab label="Texto" />
            <Tab label="Arquivo (PDF, TXT, DOCX)" />
            <Tab label="Batch (CSV, Excel)" />
          </Tabs>
          {tab === 0 && (
            <Box mt={2}>
              <TextField
                label="Digite ou cole o texto"
                multiline
                minRows={4}
                fullWidth
                value={text}
                onChange={e => setText(e.target.value)}
                variant="outlined"
              />
              <Button
                variant="contained"
                sx={{ mt: 2, bgcolor: PRIMARY, '&:hover': { bgcolor: SECONDARY, color: '#fff' } }}
                onClick={handleTextAnalyze}
                disabled={loading || !text.trim()}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : 'Analisar Sentimento'}
              </Button>
            </Box>
          )}
          {tab === 1 && (
            <Box mt={2}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadFileIcon />}
                sx={{ borderColor: PRIMARY, color: PRIMARY, '&:hover': { borderColor: SECONDARY, color: SECONDARY } }}
                fullWidth
              >
                {file ? file.name : 'Selecionar Arquivo'}
                <input type="file" accept=".pdf,.txt,.docx" hidden onChange={e => setFile(e.target.files[0])} />
              </Button>
              <Button
                variant="contained"
                sx={{ mt: 2, bgcolor: PRIMARY, '&:hover': { bgcolor: SECONDARY, color: '#fff' } }}
                onClick={() => handleFileAnalyze(false)}
                disabled={loading || !file}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : 'Analisar Sentimento'}
              </Button>
            </Box>
          )}
          {tab === 2 && (
            <Box mt={2}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadFileIcon />}
                sx={{ borderColor: PRIMARY, color: PRIMARY, '&:hover': { borderColor: SECONDARY, color: SECONDARY } }}
                fullWidth
              >
                {file ? file.name : 'Selecionar CSV ou Excel'}
                <input type="file" accept=".csv,.xlsx" hidden onChange={e => setFile(e.target.files[0])} />
              </Button>
              <Button
                variant="contained"
                sx={{ mt: 2, bgcolor: PRIMARY, '&:hover': { bgcolor: SECONDARY, color: '#fff' } }}
                onClick={() => handleFileAnalyze(true)}
                disabled={loading || !file}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : 'Processar Batch'}
              </Button>
            </Box>
          )}
          <SentimentResult result={result} />
        </Paper>
      </Box>
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert onClose={() => setSnack({ ...snack, open: false })} severity={snack.type}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
