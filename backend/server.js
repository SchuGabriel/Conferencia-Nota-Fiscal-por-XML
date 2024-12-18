const express = require('express');
const multer = require('multer');
const xml2js = require('xml2js');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());

// Configuração do multer para armazenamento na memória
const upload = multer({ storage: multer.memoryStorage() });

app.post('/upload-xml', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado.' });
    }

    const xmlContent = req.file.buffer.toString();

    const parser = new xml2js.Parser({ explicitArray: false });
    parser.parseString(xmlContent, (err, result) => {
      if (err) {
        console.error('Erro ao analisar o XML:', err.message);
        return res.status(400).json({ error: 'Erro ao analisar o XML.' });
      }

      try {
        // Navegar até os produtos no XML
        const produtos = result.nfeProc.NFe.infNFe.det.map((item) => ({
          codigo: item.prod.cProd,
          descricao: item.prod.xProd,
          quantidade: parseFloat(item.prod.qCom),
        }));

        // Retornar os produtos como JSON
        res.json(produtos);
      } catch (error) {
        console.error('Erro ao processar os produtos:', error.message);
        res.status(500).json({ error: 'Erro ao processar os produtos no XML.' });
      }
    });
  } catch (error) {
    console.error('Erro interno no servidor:', error.message);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
