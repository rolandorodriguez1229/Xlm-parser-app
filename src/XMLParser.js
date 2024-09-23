import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const XMLParser = () => {
  const [parsedData, setParsedData] = useState({});
  const [summary, setSummary] = useState({
    studs: {},
    kingStuds: {},
    totalHeaders330: 0,
    totalJacks696: 0
  });
  const [mesa2Data, setMesa2Data] = useState([]);
  const [mesa3Data, setMesa3Data] = useState([]);

  // Existing XML parsing functions...
  // (parseXML, convertLength, groupAndSortData)

  const updateSummary = (newParsedData) => {
    // ... (existing updateSummary logic)
  };

  const handleXMLUpload = async (event) => {
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

  const handleXLSUpload = (event, mesa) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, {type: 'array'});
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, {header: 1});
      
      if (mesa === 2) {
        const processedData = jsonData.slice(1).map(row => ({
          orderId: row[0],
          bundle: row[1],
          LF: row[2]?.includes('/') ? row[2].split('/')[1].trim() : row[2]
        }));
        setMesa2Data(processedData);
      } else if (mesa === 3) {
        const processedData = jsonData.slice(1).map(row => ({
          job: row[0],
          bundle: row[1],
          LF: row[2]?.includes('/') ? row[2].split('/')[1].trim() : row[2]
        }));
        setMesa3Data(processedData);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Multi-File XML and XLS Parser</h2>
      
      {/* XML file input */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Upload XML Files</h3>
        <input
          type="file"
          webkitdirectory="true"
          directory="true"
          multiple
          onChange={handleXMLUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>
      
      {/* Mesa 2 XLS input */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Upload Mesa 2 XLS File</h3>
        <input
          type="file"
          accept=".xls,.xlsx"
          onChange={(e) => handleXLSUpload(e, 2)}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>
      
      {/* Mesa 3 XLS input */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Upload Mesa 3 XLS File</h3>
        <input
          type="file"
          accept=".xls,.xlsx"
          onChange={(e) => handleXLSUpload(e, 3)}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>
      
      {/* Existing summary and parsed data display... */}
      {/* (Keep the existing code for displaying XML data) */}
      
      {/* Display Mesa 2 Data */}
      {mesa2Data.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-2">Mesa 2 Data</h3>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">Order ID</th>
                <th className="border border-gray-300 p-2">Bundle</th>
                <th className="border border-gray-300 p-2">LF</th>
              </tr>
            </thead>
            <tbody>
              {mesa2Data.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 p-2">{item.orderId}</td>
                  <td className="border border-gray-300 p-2">{item.bundle}</td>
                  <td className="border border-gray-300 p-2">{item.LF}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Display Mesa 3 Data */}
      {mesa3Data.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-2">Mesa 3 Data</h3>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">Job</th>
                <th className="border border-gray-300 p-2">Bundle</th>
                <th className="border border-gray-300 p-2">LF</th>
              </tr>
            </thead>
            <tbody>
              {mesa3Data.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 p-2">{item.job}</td>
                  <td className="border border-gray-300 p-2">{item.bundle}</td>
                  <td className="border border-gray-300 p-2">{item.LF}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default XMLParser;