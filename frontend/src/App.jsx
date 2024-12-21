import React, { useState, useRef } from 'react';

function App() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    fetch('http://localhost:3001/upload-xml', {
      method: 'POST',
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Erro no upload do arquivo.');
        }
        return response.json();
      })
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setProducts([]);
        } else {
          setError('');
          setProducts(data);
        }
      })
      .catch((err) => {
        console.error('Erro ao enviar arquivo:', err);
        setError('Erro ao enviar o arquivo.');
      });
  };

  const handleEanProd = (codeProduct, ean) => {
    console.log("Código Manual:", codeProduct, "EAN:", ean);
    let product;
    const updatedProducts = products.map((item) => {
      product = item.code + " " + item.name;
      if (codeProduct) {
        if (product.includes(codeProduct)) {
          return {
            ...item,
            countQuantity: item.countQuantity + 1,
            finalQuantity: item.predictedQuantity - (item.countQuantity + 1),
          };
        }
      } else if (ean) {
        if (item.ean === ean) {
          return {
            ...item,
            countQuantity: item.countQuantity + 1,
            finalQuantity: item.predictedQuantity - (item.countQuantity + 1),
          };
        }
      }
      return item;
    });
    setProducts(updatedProducts);
  };

  const handleReset = () => {
    if (!confirm("Deseja resetar?")) {
      return;
    }

    const resetProducts = products.map((item) => {
      return {
        ...item,
        countQuantity: 0,
        finalQuantity: 0,
      }
    });

    setProducts(resetProducts);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Upload de XML</h1>
      <div>
        <input
          type="file"
          accept=".xml"
          onChange={handleFileUpload}
          ref={fileInputRef}
        />
        <input
          type="text"
          placeholder="Digite o EAN e pressione Enter"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleEanProd(null, e.target.value);
              e.target.value = '';
            }
          }}
        />
        <label>
          {' '}Manual
          <input
            type="text"
            placeholder="Codigo Manual"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleEanProd(e.target.value, null);
                e.target.value = '';
              }
            }}
          />
        </label>

        <input type="button" value="Resetar Nota" onClick={handleReset} />
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>

      {products.length > 0 && (
        <table border="1" cellPadding="10" cellSpacing="0" style={{ marginTop: '20px', width: '100%' }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Produto</th>
              <th>Quantidade Prevista</th>
              <th>Quantidade Contada</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.pos}>
                <td>{index + 1}</td>
                <td>{product.code + " " + product.name}</td>
                <td>{product.predictedQuantity}</td>
                <td>{product.countQuantity}</td>
                <td>{product.finalQuantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;