import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const XMLParser = () => {
  const [parsedData, setParsedData] = useState({});
  const [summaries, setSummaries] = useState({ mesa2: {}, mesa3: {} });
  const [jobGroups, setJobGroups] = useState({ mesa2: [], mesa3: [] });

  const parseXML = (xmlString) => {
    // ... (el resto del código de parseXML permanece igual)
  };

  const convertLength = (inches) => {
    // ... (el resto del código de convertLength permanece igual)
  };

  const groupAndSortData = (data) => {
    // ... (el resto del código de groupAndSortData permanece igual)
  };

  const updateSummaries = (newParsedData) => {
    // ... (el resto del código de updateSummaries permanece igual)
  };

  const handleXMLUpload = async (event) => {
    const files = event.target.files;
    const newParsedData = {};

    for (let file of files) {
      const pathParts = file.webkitRelativePath.split('/');
      const jobNumber = pathParts[pathParts.length - 2];
      const fileName = pathParts[pathParts.length - 1];

      const content = await file.text();
      const fileData = parseXML(content);

      if (!newParsedData[jobNumber]) {
        newParsedData[jobNumber] = {};
      }
      newParsedData[jobNumber][fileName] = fileData;
    }

    setParsedData(newParsedData);
    updateSummaries(newParsedData);
  };

  const handleExcelUpload = (mesa) => (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      const newJobGroups = { ...jobGroups };
      if (mesa === 'mesa2') {
        newJobGroups.mesa2 = json.map(row => row['C'].toString());
      } else if (mesa === 'mesa3') {
        newJobGroups.mesa3 = json.map(row => row['B'].toString());
      }

      setJobGroups(newJobGroups);
      updateSummaries(parsedData);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Multi-File XML Parser with Excel Grouping</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Upload XML Files</label>
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
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Upload Mesa 2 Excel File</label>
        <input
          type="file"
          accept=".xls,.xlsx"
          onChange={handleExcelUpload('mesa2')}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-green-50 file:text-green-700
            hover:file:bg-green-100"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Upload Mesa 3 Excel File</label>
        <input
          type="file"
          accept=".xls,.xlsx"
          onChange={handleExcelUpload('mesa3')}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-yellow-50 file:text-yellow-700
            hover:file:bg-yellow-100"
        />
      </div>
      {Object.keys(parsedData).length > 0 && (
        <div>
          {['mesa2', 'mesa3'].map(mesa => (
            <div key={mesa}>
              <h3 className="text-xl font-bold mb-2">Summary for {mesa.toUpperCase()}</h3>
              <table className="w-full border-collapse border border-gray-300 mb-8">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2">Total Studs</th>
                    <th className="border border-gray-300 p-2">Total Kings</th>
                    <th className="border border-gray-300 p-2">Total Headers (3-3-0)</th>
                    <th className="border border-gray-300 p-2">Total Jacks (6-9-6)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-2">{summaries[mesa].totalStuds}</td>
                    <td className="border border-gray-300 p-2">{summaries[mesa].totalKings}</td>
                    <td className="border border-gray-300 p-2">{summaries[mesa].totalHeaders330}</td>
                    <td className="border border-gray-300 p-2">{summaries[mesa].totalJacks696}</td>
                  </tr>
                </tbody>
              </table>
              {jobGroups[mesa].map(jobNumber => {
                if (parsedData[jobNumber]) {
                  return (
                    <div key={jobNumber} className="mb-8">
                      <h3 className="text-xl font-bold mb-2">Job Number: {jobNumber}</h3>
                      {Object.entries(parsedData[jobNumber]).map(([fileName, fileData]) => (
                        <div key={fileName} className="mb-4">
                          <h4 className="text-lg font-semibold mb-2">File: {fileName}</h4>
                          <table className="w-full border-collapse border border-gray-300">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border border-gray-300 p-2">Type</th>
                                <th className="border border-gray-300 p-2">Length (ft-in-16ths)</th>
                                <th className="border border-gray-300 p-2">Count</th>
                                <th className="border border-gray-300 p-2">Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {fileData.map((item, index) => (
                                <tr key={index}>
                                  <td className="border border-gray-300 p-2">{item.type}</td>
                                  <td className="border border-gray-300 p-2">{item.convertedLength}</td>
                                  <td className="border border-gray-300 p-2">{item.count}</td>
                                  <td className="border border-gray-300 p-2">{item.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default XMLParser;
