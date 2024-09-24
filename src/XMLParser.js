import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const XMLParser = () => {
  const [parsedData, setParsedData] = useState({});
  const [summary, setSummary] = useState({});
  const [mesa2Data, setMesa2Data] = useState([]);
  const [mesa3Data, setMesa3Data] = useState([]);
  const [validJobNumbers, setValidJobNumbers] = useState(new Set());
  
  const [xmlFiles, setXmlFiles] = useState([]);
  const [mesa2File, setMesa2File] = useState(null);
  const [mesa3File, setMesa3File] = useState(null);

  // ... (mantener las funciones parseXML, convertLength, groupAndSortData como están)

  const createDetailedSummary = (parsedData, jobNumbers) => {
    const summary = {
      studs: {},
      kingStuds: {},
      jacks: {},
      headers: {}
    };

    jobNumbers.forEach(jobNumber => {
      if (parsedData[jobNumber]) {
        Object.values(parsedData[jobNumber]).forEach(fileData => {
          fileData.forEach(item => {
            const key = `${item.convertedLength}-${item.description}`;
            if (item.type.toUpperCase() === 'STUD') {
              if (!summary.studs[key]) summary.studs[key] = 0;
              summary.studs[key] += item.count;
            } else if (item.type.toUpperCase() === 'KING STUD') {
              if (!summary.kingStuds[key]) summary.kingStuds[key] = 0;
              summary.kingStuds[key] += item.count;
            } else if (item.type.toUpperCase() === 'JACK' && item.convertedLength === '6-9-6') {
              if (!summary.jacks[item.description]) summary.jacks[item.description] = 0;
              summary.jacks[item.description] += item.count;
            } else if (item.type.toUpperCase() === 'HEADER' && item.convertedLength === '3-3-0') {
              if (!summary.headers[item.description]) summary.headers[item.description] = 0;
              summary.headers[item.description] += item.count;
            }
          });
        });
      }
    });

    return summary;
  };

  const handleXMLUpload = (event) => {
    setXmlFiles(Array.from(event.target.files));
  };

  const handleXLSUpload = (event, mesa) => {
    const file = event.target.files[0];
    if (mesa === 2) {
      setMesa2File(file);
    } else if (mesa === 3) {
      setMesa3File(file);
    }
  };

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

    setParsedData(newParsedData);

    const mesa2JobNumbers = mesa2Data.map(item => item.jobNumber);
    const mesa3JobNumbers = mesa3Data.map(item => item.jobNumber);
    const mesa2Summary = createDetailedSummary(newParsedData, mesa2JobNumbers);
    const mesa3Summary = createDetailedSummary(newParsedData, mesa3JobNumbers);

    setSummary({ mesa2: mesa2Summary, mesa3: mesa3Summary });
  };

  const processXLSFile = (file, mesa) => {
    // ... (mantener como está)
  };

  const updateValidJobNumbers = (newJobNumbers) => {
    // ... (mantener como está)
  };

  const renderSummary = (mesaSummary, mesaName) => (
    <div className="mb-8">
      <h3 className="text-xl font-bold mb-2">Summary for {mesaName}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-lg font-semibold mb-2">Studs</h4>
          <ul>
            {Object.entries(mesaSummary.studs).map(([key, count]) => {
              const [length, description] = key.split('-');
              return <li key={key}>{length} - {description}: {count}</li>;
            })}
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-2">King Studs</h4>
          <ul>
            {Object.entries(mesaSummary.kingStuds).map(([key, count]) => {
              const [length, description] = key.split('-');
              return <li key={key}>{length} - {description}: {count}</li>;
            })}
          </ul>
        </div>
      </div>
      <div className="mt-4">
        <h4 className="text-lg font-semibold mb-2">Jacks (6-9-6)</h4>
        <ul>
          {Object.entries(mesaSummary.jacks).map(([description, count]) => (
            <li key={description}>{description}: {count}</li>
          ))}
        </ul>
      </div>
      <div className="mt-4">
        <h4 className="text-lg font-semibold mb-2">Headers (3-3-0)</h4>
        <ul>
          {Object.entries(mesaSummary.headers).map(([description, count]) => (
            <li key={description}>{description}: {count}</li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Multi-File XML and XLS Parser</h2>
      
      {/* Input fields */}
      {/* ... (mantener los inputs como están) */}

      <button
        onClick={processFiles}
        className="mb-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Process Files
      </button>
      
      {/* Mesa 2 Summary and Data Display */}
      {summary.mesa2 && renderSummary(summary.mesa2, "Mesa 2")}
      {mesa2Data.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-2">Mesa 2 Data</h3>
          <table className="w-full border-collapse border border-gray-300">
            {/* ... (mantener la tabla como está) */}
          </table>
        </div>
      )}
      
      {/* Mesa 3 Summary and Data Display */}
      {summary.mesa3 && renderSummary(summary.mesa3, "Mesa 3")}
      {mesa3Data.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-2">Mesa 3 Data</h3>
          <table className="w-full border-collapse border border-gray-300">
            {/* ... (mantener la tabla como está) */}
          </table>
        </div>
      )}
    </div>
  );
};

export default XMLParser;
