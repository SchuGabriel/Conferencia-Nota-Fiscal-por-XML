import React, { useState, useRef } from 'react';
import icon_green from './assets/images/icons/im_green.png';
import icon_red from './assets/images/icons/im_red.png';

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
    let product;
    const updatedProducts = products.map((item) => {
      product = item.code + " " + item.name;
      if (codeProduct) {
        if (product.includes(codeProduct)) {
          return {
            ...item,
            countQuantity: item.countQuantity + 1,
            finalQuantity: (item.countQuantity + 1) - item.predictedQuantity,
          };
        }
      } else if (ean) {
        if (item.ean === ean) {
          return {
            ...item,
            countQuantity: item.countQuantity + 1,
            finalQuantity: (item.countQuantity + 1) - item.predictedQuantity,
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

  const handleButtonCount = (action, index) => {
    const updatedProducts = [...products]
    
    if (action){
      updatedProducts[index].countQuantity += 1;
      } else {
      updatedProducts[index].countQuantity -= 1;
    }

    updatedProducts[index].finalQuantity = updatedProducts[index].countQuantity - updatedProducts[index].predictedQuantity;

    setProducts(updatedProducts);
  }

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
              <th>Status</th>
              <th>Produto</th>
              <th>Quantidade Prevista</th>
              <th>Quantidade Contada</th>
              <th>Total</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{product.finalQuantity === 0 ? <img src={icon_green}/> : <img src={icon_red}/>}</td>
                <td>{product.code + " " + product.name}</td>
                <td>{product.predictedQuantity}</td>
                <td>{product.countQuantity}</td>
                <td>{product.finalQuantity}</td>
                <td>
                  <button type="button" onClick={ () => handleButtonCount(true, index)}>+</button>
                  <button type="button" onClick={ () => handleButtonCount(false, index)}>-</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;