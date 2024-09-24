import React, { useState } from 'react';

const XMLParser = () => {
  const [parsedData, setParsedData] = useState({});
  const [summary, setSummary] = useState([]);

  const parseXML = (xmlString, fileName, jobNumber) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const memberDataElements = xmlDoc.getElementsByTagName("MEMBER_DATA");

    const extractedData = Array.from(memberDataElements)
      .map(member => ({
        type: member.getElementsByTagName("TYPE")[0]?.textContent.trim().toUpperCase() || '',
        name: member.getElementsByTagName("NAME")[0]?.textContent || '',
        description: member.getElementsByTagName("DESCRIPTION")[0]?.textContent || '',
        length: parseFloat(member.getElementsByTagName("LENGTH")[0]?.textContent || '0'),
        units: member.getElementsByTagName("LENGTH")[0]?.getAttribute("UNITS") || ''
      }))
      .filter(item => !item.type.toLowerCase().includes('plate') && !item.description.toLowerCase().includes('plate'));

    return groupAndSortData(extractedData);
  };

  const convertLength = (inches) => {
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    const wholeInches = Math.floor(remainingInches);
    const fraction = remainingInches - wholeInches;
    const sixteenths = Math.round(fraction * 16);

    return `${feet}-${wholeInches}-${sixteenths}`;
  };

  const groupAndSortData = (data) => {
    // Orden personalizado para las tablas de los trabajos
    const typeOrder = ['KING', 'JACK', 'SILL', 'SILL CRIPPLE', 'HEADER', 'HEADER CRIPPLE'];

    const grouped = data.reduce((acc, item) => {
      const key = `${item.type}-${item.length}-${item.description}`;
      if (!acc[key]) {
        acc[key] = { ...item, count: 0, convertedLength: convertLength(item.length) };
      }
      acc[key].count++;
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => {
      const typeOrderA = typeOrder.indexOf(a.type.toUpperCase());
      const typeOrderB = typeOrder.indexOf(b.type.toUpperCase());

      if (typeOrderA !== -1 && typeOrderB !== -1) {
        if (typeOrderA !== typeOrderB) {
          return typeOrderA - typeOrderB;
        }
      } else if (typeOrderA !== -1) {
        return -1;
      } else if (typeOrderB !== -1) {
        return 1;
      } else {
        // Si ambos tipos no están en typeOrder, los ordenamos alfabéticamente
        return a.type.localeCompare(b.type);
      }

      // Ordenamos por longitud de mayor a menor
      return b.length - a.length;
    });
  };

  const updateSummary = (newParsedData) => {
    const newSummary = [];

    Object.values(newParsedData).forEach(jobData => {
      Object.values(jobData).forEach(fileData => {
        fileData.forEach(item => {
          if (['STUD', 'KING', 'JACK', 'HEADER'].includes(item.type.toUpperCase())) {
            const summaryItem = newSummary.find(
              si => si.materialType === item.type &&
                    si.length === item.convertedLength &&
                    si.description === item.description
            );

            if (summaryItem) {
              summaryItem.quantity += item.count;
            } else {
              newSummary.push({
                materialType: item.type,
                length: item.convertedLength,
                description: item.description,
                quantity: item.count
              });
            }
          }
        });
      });
    });

    // Mantener el orden original del resumen
    newSummary.sort((a, b) => {
      const typeOrder = ['STUD', 'KING', 'JACK', 'HEADER'];
      const typeOrderA = typeOrder.indexOf(a.materialType.toUpperCase());
      const typeOrderB = typeOrder.indexOf(b.materialType.toUpperCase());
      if (typeOrderA !== typeOrderB) {
        return typeOrderA - typeOrderB;
      }
      // Convertir la longitud de vuelta a pulgadas para comparar
      const [feetA, inchesA, sixteenthsA] = a.length.split('-').map(Number);
      const [feetB, inchesB, sixteenthsB] = b.length.split('-').map(Number);
      const totalInchesA = feetA * 12 + inchesA + sixteenthsA / 16;
      const totalInchesB = feetB * 12 + inchesB + sixteenthsB / 16;
      return totalInchesB - totalInchesA;
    });

    setSummary(newSummary);
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    const newParsedData = {};

    for (let file of files) {
      const pathParts = file.webkitRelativePath.split('/');
      const jobNumber = pathParts[pathParts.length - 2];
      const fileName = pathParts[pathParts.length - 1];

      const content = await file.text();
      const fileData = parseXML(content, fileName, jobNumber);

      if (!newParsedData[jobNumber]) {
        newParsedData[jobNumber] = {};
      }
      newParsedData[jobNumber][fileName] = fileData;
    }

    setParsedData(newParsedData);
    updateSummary(newParsedData);
  };

  const renderSummary = () => {
    let currentType = null;
    return summary.map((item, index) => {
      const isNewType = currentType !== item.materialType;
      if (isNewType) {
        currentType = item.materialType;
      }
      return (
        <React.Fragment key={index}>
          {isNewType && index !== 0 && (
            <tr className="h-4">
              <td colSpan="4"></td>
            </tr>
          )}
          <tr>
            <td className="border border-gray-300 p-2 text-center">{item.materialType}</td>
            <td className="border border-gray-300 p-2 text-center">{item.length}</td>
            <td className="border border-gray-300 p-2 text-center">{item.quantity}</td>
            <td className="border border-gray-300 p-2 text-center">{item.description}</td>
          </tr>
        </React.Fragment>
      );
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Multi-File XML Parser</h2>
      <div className="mb-4">
        <input
          type="file"
          webkitdirectory="true"
          directory="true"
          multiple
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>
      {summary.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-2">Summary</h3>
          <table className="w-full border-collapse border border-gray-300 mb-8">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-center">Material Type</th>
                <th className="border border-gray-300 p-2 text-center">Length</th>
                <th className="border border-gray-300 p-2 text-center">Quantity</th>
                <th className="border border-gray-300 p-2 text-center">Description</th>
              </tr>
            </thead>
            <tbody>
              {renderSummary()}
            </tbody>
          </table>
        </div>
      )}
      {Object.entries(parsedData).map(([jobNumber, jobData]) => (
        <div key={jobNumber} className="mb-8">
          <h3 className="text-xl font-bold mb-2">Job Number: {jobNumber}</h3>
          {Object.entries(jobData).map(([fileName, fileData]) => (
            <div key={fileName} className="mb-4">
              <h4 className="text-lg font-semibold mb-2">File: {fileName}</h4>
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-center">Type</th>
                    <th className="border border-gray-300 p-2 text-center">Length (ft-in-16ths)</th>
                    <th className="border border-gray-300 p-2 text-center">Count</th>
                    <th className="border border-gray-300 p-2 text-center">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {fileData.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 p-2 text-center">{item.type}</td>
                      <td className="border border-gray-300 p-2 text-center">{item.convertedLength}</td>
                      <td className="border border-gray-300 p-2 text-center">{item.count}</td>
                      <td className="border border-gray-300 p-2 text-center">{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default XMLParser;
