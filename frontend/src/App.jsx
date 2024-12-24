import React, { useState, useRef, useEffect } from 'react';
import jsPDF from "jspdf";
import "jspdf-autotable";

import icon_green from './assets/images/icons/im_green.png';
import icon_red from './assets/images/icons/im_red.png';

function App() {
  const [products, setProducts] = useState([]);
  const [unexpectedProducts, setUnexpectedProducts] = useState([]);
  const [NF, setNF] = useState({ number: '', serial: '' });
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
          setNF('');
        } else {
          setError('');
          setProducts(data.prod);
          setNF({
            number: data.nf.number,
            serial: data.nf.serial
          });
        }
      })
      .catch((err) => {
        console.error('Erro ao enviar arquivo:', err);
        setError('Erro ao enviar o arquivo.');
      });
  };

  const handleEanProd = (codeProduct, ean) => {
    let product;
    let finded = false;

    const updatedProducts = products.map((item) => {
      product = item.code + " " + item.name;
      if (codeProduct && product.includes(codeProduct)) {
        finded = true;
        return {
          ...item,
          countQuantity: item.countQuantity + 1,
          finalQuantity: (item.countQuantity + 1) - item.predictedQuantity,
        };
      } else if (ean && item.ean === ean) {
        finded = true;
        return {
          ...item,
          countQuantity: item.countQuantity + 1,
          finalQuantity: (item.countQuantity + 1) - item.predictedQuantity,
        };
      }
      return item;
    });

    if (!finded) {
      let unexpectedItem = unexpectedProducts.find(item =>
        item.name.includes(codeProduct ? codeProduct : ean)
      );

      if (unexpectedItem) {
        const updatedUnexpectedProducts = unexpectedProducts.map((item) =>
          item.name === unexpectedItem.name
            ? { ...item, countQuantity: item.countQuantity + 1 }
            : item
        );
        setUnexpectedProducts(updatedUnexpectedProducts);
      } else {
        const newUnexpectedProduct = {
          pos: unexpectedProducts.length + 1,
          name: codeProduct ? codeProduct : ean,
          countQuantity: 1,
        };
        setUnexpectedProducts([...unexpectedProducts, newUnexpectedProduct]);
      }
    }
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
        finalQuantity: item.predictedQuantity * -1,
      }
    });

    setProducts(resetProducts);
    setUnexpectedProducts([]);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonCount = (action, index, isExpected) => {
    if (isExpected && action != 3) {
      const updatedProducts = [...products];
      updatedProducts[index].countQuantity += action === 1 ? 1 : -1;

      updatedProducts[index].countQuantity = updatedProducts[index].countQuantity < 0
        ? 0
        : updatedProducts[index].countQuantity;

      updatedProducts[index].finalQuantity = updatedProducts[index].countQuantity - updatedProducts[index].predictedQuantity;

      setProducts(updatedProducts);
    } else if (action != 3) {
      const updatedUnexpectedProducts = [...unexpectedProducts];
      updatedUnexpectedProducts[index].countQuantity += action === 1 ? 1 : -1

      updatedUnexpectedProducts[index].countQuantity = updatedUnexpectedProducts[index].countQuantity < 1
        ? 1
        : updatedUnexpectedProducts[index].countQuantity;

      setUnexpectedProducts(updatedUnexpectedProducts)
    } else {
      const updatedUnexpectedProducts = [...unexpectedProducts];
      updatedUnexpectedProducts.splice(index, 1);

      updatedUnexpectedProducts.map((item, index) => {
        item.pos = index + 1;
      });

      setUnexpectedProducts(updatedUnexpectedProducts)
    }
  }

  const handleCheck = () => {
    const CurrentProducts = [...products];
    let productfailed = [];

    products.forEach((item) => {
      if (item.finalQuantity !== 0) {
        productfailed.push(item.pos - 1);
      }
    });

    if (productfailed.length > 0) {
      const doc = new jsPDF();

      let title = "Itens com divergência - Nota Fiscal: " + NF.number + " Serie: " + NF.serial;
      doc.setFontSize(12);
      doc.text(title, 50, 10);

      let newpage = false;

      const tableData = productfailed.map((item) => {
        newpage = true;
        const product = CurrentProducts[item];
        const status =
          product.finalQuantity < 0
            ? `Faltou: ${Math.abs(product.finalQuantity)}`
            : `Sobrou: ${Math.abs(product.finalQuantity)}`;

        return [product.code + product.name, status];
      });

      doc.autoTable({
        head: [["Produto", "Situação"]],
        body: tableData,
        startY: 20,
      });

      const tableData2 = unexpectedProducts.map((item) => {
        const status = `Chegou sem constar na NF: ${Math.abs(item.countQuantity)}`;
        return [item.name, status];
      });

      if (unexpectedProducts.length > 0) {
        if (newpage) {
          doc.addPage();
          let title = "Itens Inesperados - Nota Fiscal: " + NF.number + " Serie: " + NF.serial;
          doc.text(title, 50, 10)
        }

        doc.autoTable({
          head: [["Produto", "Situação"]],
          body: tableData2,
          startY: 20,
        });
      }

      doc.save("divergencias.pdf");
    } else {
      alert("Todos os itens estão corretos.")
    }

    setProducts('');
    setUnexpectedProducts('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

        <input type="button" value="Finalizar Conferencia" onClick={handleCheck} />

        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>

      {products.length > 0 && (
        <div>
          <div>
            <table border="1" cellPadding="10" cellSpacing="0" style={{ marginTop: '20px', width: '100%' }}>
              <thead>
                <tr>
                  <th colSpan={7}>Produtos Esperados</th>
                </tr>
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
                {products.map((product) => (
                  <tr key={product.pos}>
                    <td>{product.pos}</td>
                    <td>{product.finalQuantity === 0 ? <img src={icon_green} /> : <img src={icon_red} />}</td>
                    <td>{product.code + " " + product.name}</td>
                    <td>{product.predictedQuantity}</td>
                    <td>{product.countQuantity}</td>
                    <td>{product.finalQuantity}</td>
                    <td>
                      <button type="button" onClick={() => handleButtonCount(1, product.pos - 1, true)}>+</button>
                      <button type="button" onClick={() => handleButtonCount(2, product.pos - 1, true)}>-</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {unexpectedProducts.length > 0 && (
        <div>
          <table border="1" cellPadding="10" cellSpacing="0" style={{ marginTop: '20px', width: '100%' }}>
            <thead>
              <tr>
                <th colSpan={4}>
                  Produtos Inesperados
                </th>
              </tr>
              <tr>
                <th>#</th>
                <th>Produto</th>
                <th>Quantidade Contada</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {unexpectedProducts.map((product) => (
                <tr key={product.pos}>
                  <td>{product.pos}</td>
                  <td>{product.name}</td>
                  <td>{product.countQuantity}</td>
                  <td>
                    <button type="button" onClick={() => handleButtonCount(1, product.pos - 1, false)}>+</button>
                    <button type="button" onClick={() => handleButtonCount(2, product.pos - 1, false)}>-</button>
                    <button type="button" onClick={() => handleButtonCount(3, product.pos - 1, false)}>x</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;