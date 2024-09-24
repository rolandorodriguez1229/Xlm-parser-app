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

  const parseXML = (xmlString) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const memberDataElements = xmlDoc.getElementsByTagName("MEMBER_DATA");
    
    const extractedData = Array.from(memberDataElements)
      .map(member => ({
        type: member.getElementsByTagName("TYPE")[0]?.textContent || '',
        description: member.getElementsByTagName("DESCRIPTION")[0]?.textContent || '',
        length: parseFloat(member.getElementsByTagName("LENGTH")[0]?.textContent || '0'),
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
    const typeOrder = ['STUD', 'KING STUD', 'JACK'];
    const grouped = data.reduce((acc, item) => {
      const key = `${item.type}-${item.length}`;
      if (!acc[key]) {
        acc[key] = { ...item, count: 0, convertedLength: convertLength(item.length) };
      }
      acc[key].count++;
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => {
      const typeOrderA = typeOrder.indexOf(a.type.toUpperCase());
      const typeOrderB = typeOrder.indexOf(b.type.toUpperCase());
      if (typeOrderA !== typeOrderB) return typeOrderA - typeOrderB;
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return b.length - a.length;
    });
  };

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
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {header: 1});
        
        if (mesa === 2) {
          const processedData = jsonData.slice(1).map(row => ({
            jobNumber: row[2],
            bundle: row[3],
            LF: row[4]
          })).filter(item => item.jobNumber);
          setMesa2Data(processedData);
          updateValidJobNumbers(processedData.map(item => item.jobNumber));
        } else if (mesa === 3) {
          const processedData = jsonData.slice(1).map(row => ({
            jobNumber: row[1],
            bundle: row[2],
            LF: row[4]
          })).filter(item => item.jobNumber);
          setMesa3Data(processedData);
          updateValidJobNumbers(processedData.map(item => item.jobNumber));
        }
        resolve();
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const updateValidJobNumbers = (newJobNumbers) => {
    setValidJobNumbers(prevSet => {
      const newSet = new Set(prevSet);
      newJobNumbers.forEach(jobNumber => newSet.add(jobNumber));
      return newSet;
    });
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
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">Job Number</th>
                <th className="border border-gray-300 p-2">Bundle</th>
                <th className="border border-gray-300 p-2">LF</th>
              </tr>
            </thead>
            <tbody>
              {mesa2Data.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 p-2">{item.jobNumber}</td>
                  <td className="border border-gray-300 p-2">{item.bundle}</td>
                  <td className="border border-gray-300 p-2">{item.LF}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Mesa 3 Summary and Data Display */}
      {summary.mesa3 && renderSummary(summary.mesa3, "Mesa 3")}
      {mesa3Data.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-2">Mesa 3 Data</h3>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">Job Number</th>
                <th className="border border-gray-300 p-2">Bundle</th>
                <th className="border border-gray-300 p-2">LF</th>
              </tr>
            </thead>
            <tbody>
              {mesa3Data.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 p-2">{item.jobNumber}</td>
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
