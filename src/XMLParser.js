import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';

const XMLParser = () => {
  const [xmlFiles, setXmlFiles] = useState([]);
  const [excelFiles, setExcelFiles] = useState({ mesa2: null, mesa3: null });
  const [parsedData, setParsedData] = useState({});
  const [summaries, setSummaries] = useState({ mesa2: {}, mesa3: {} });
  const [jobGroups, setJobGroups] = useState({ mesa2: [], mesa3: [] });
  const [isProcessing, setIsProcessing] = useState(false);

  const convertLength = useCallback((inches) => {
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    const wholeInches = Math.floor(remainingInches);
    const fraction = remainingInches - wholeInches;
    const sixteenths = Math.round(fraction * 16);
    
    return `${feet}-${wholeInches}-${sixteenths}`;
  }, []);

  const groupAndSortData = useCallback((data) => {
    // ... (implementation remains the same)
  }, [convertLength]);

  const parseXML = useCallback((xmlString) => {
    // ... (implementation remains the same)
  }, [groupAndSortData]);

  const updateSummaries = useCallback((newParsedData) => {
    // ... (implementation remains the same)
  }, [jobGroups]);

  const handleXMLUpload = (event) => {
    const files = event.target.files;
    if (files) {
      setXmlFiles(Array.from(files));
    }
  };

  const handleExcelUpload = (mesa) => (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setExcelFiles(prev => ({ ...prev, [mesa]: file }));
    }
  };

  const processFiles = async () => {
    setIsProcessing(true);
    const newParsedData = {};
    
    // Process XML files
    for (let file of xmlFiles) {
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

    // Process Excel files
    const processExcel = async (file, mesa) => {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      const newJobGroups = mesa === 'mesa2'
        ? json.map(row => row['C']?.toString() || '')
        : json.map(row => row['B']?.toString() || '');

      setJobGroups(prev => ({ ...prev, [mesa]: newJobGroups }));
    };

    if (excelFiles.mesa2) await processExcel(excelFiles.mesa2, 'mesa2');
    if (excelFiles.mesa3) await processExcel(excelFiles.mesa3, 'mesa3');

    setParsedData(newParsedData);
    updateSummaries(newParsedData);
    setIsProcessing(false);
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
        <p className="mt-1 text-sm text-gray-500">XML files loaded: {xmlFiles.length}</p>
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
        <p className="mt-1 text-sm text-gray-500">
          {excelFiles.mesa2 ? `File loaded: ${excelFiles.mesa2.name}` : 'No file loaded'}
        </p>
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
        <p className="mt-1 text-sm text-gray-500">
          {excelFiles.mesa3 ? `File loaded: ${excelFiles.mesa3.name}` : 'No file loaded'}
        </p>
      </div>
      <button
        onClick={processFiles}
        disabled={isProcessing || xmlFiles.length === 0 || !excelFiles.mesa2 || !excelFiles.mesa3}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isProcessing ? 'Processing...' : 'Process Files'}
      </button>
      {Object.keys(parsedData).length > 0 && (
        <div>
          {/* ... (rest of the rendering logic remains the same) ... */}
        </div>
      )}
    </div>
  );
};

export default XMLParser;
