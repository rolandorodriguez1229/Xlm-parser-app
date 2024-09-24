import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const XMLParser = () => {
  // Comentamos parsedData si no se está utilizando directamente
  // const [parsedData, setParsedData] = useState({});
  const [summary, setSummary] = useState({});
  const [mesa2Data, setMesa2Data] = useState([]);
  const [mesa3Data, setMesa3Data] = useState([]);
  const [validJobNumbers, setValidJobNumbers] = useState(new Set());
  
  const [xmlFiles, setXmlFiles] = useState([]);
  const [mesa2File, setMesa2File] = useState(null);
  const [mesa3File, setMesa3File] = useState(null);

  // ... (mantener las funciones parseXML, convertLength, groupAndSortData, createDetailedSummary como están)

  const processFiles = async () => {
    if (mesa2File) {
      await processXLSFile(mesa2File, 2);
    }
    if (mesa3File) {
      await processXLSFile(mesa3File, 3);
    }

    const newParsedData = {};
    for (let file of xmlFiles) {
      const pathParts = file.webkitRelativePath.split('/');
      const jobNumber = pathParts[pathParts.length - 2];
      
      if (validJobNumbers.has(jobNumber)) {
        const fileName = pathParts[pathParts.length - 1];
        const content = await file.text();
        const fileData = parseXML(content);

        if (!newParsedData[jobNumber]) {
          newParsedData[jobNumber] = {};
        }
        newParsedData[jobNumber][fileName] = fileData;
      }
    }

    // Comentamos setParsedData si no se está utilizando
    // setParsedData(newParsedData);

    const mesa2JobNumbers = mesa2Data.map(item => item.jobNumber);
    const mesa3JobNumbers = mesa3Data.map(item => item.jobNumber);
    const mesa2Summary = createDetailedSummary(newParsedData, mesa2JobNumbers);
    const mesa3Summary = createDetailedSummary(newParsedData, mesa3JobNumbers);

    setSummary({ mesa2: mesa2Summary, mesa3: mesa3Summary });
  };

  // ... (mantener el resto de las funciones y el JSX como están)

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {/* ... (mantener el contenido del return como está) */}
    </div>
  );
};

export default XMLParser;
