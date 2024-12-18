import React, { useState } from 'react';

function App() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');

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
          setProducts(data); // Data é o array de produtos do backend
        }
      })
      .catch((err) => {
        console.error('Erro ao enviar arquivo:', err);
        setError('Erro ao enviar o arquivo.');
      });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Upload de XML</h1>
      <input type="file" accept=".xml" onChange={handleFileUpload} />
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {products.length > 0 && (
        <table border="1" cellPadding="10" cellSpacing="0" style={{ marginTop: '20px', width: '100%' }}>
          <thead>
            <tr>
              <th>Nome do Produto</th>
              <th>Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={index}>
                <td>{product.name}</td>
                <td>{product.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
