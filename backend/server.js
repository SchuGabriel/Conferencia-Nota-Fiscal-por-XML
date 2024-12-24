const express = require('express');
const multer = require('multer');
const xml2js = require('xml2js');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

let products = [];

app.post('/upload-xml', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado.' });
    }

    const xmlContent = req.file.buffer.toString();

    const parser = new xml2js.Parser({
      explicitArray: false, 
      tagNameProcessors: [name => name.replace(/^.*:/, '')], 
    });

    parser.parseString(xmlContent, (err, result) => {
      if (err) {
        console.error('Erro ao analisar o XML:', err.message);
        return res.status(400).json({ error: 'Erro ao analisar o XML.' });
      }

      try {
        const prod = result.nfeProc.NFe.infNFe.det.map((item, index) => ({
          pos: index + 1,
          code: item.prod.cProd,
          name: item.prod.xProd.substring(0, 40),
          predictedQuantity: parseFloat(item.prod.qCom),
          ean: item.prod.cEAN,
          countQuantity: 0,
          finalQuantity: parseFloat(item.prod.qCom) * -1,
        }));

        const nf = {
          number: result.nfeProc.NFe.infNFe.ide.nNF,
          serial: result.nfeProc.NFe.infNFe.ide.serie,
        };

        products = prod;

        res.json({nf, prod});
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
