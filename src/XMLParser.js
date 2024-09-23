import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const XMLParser = () => {
  const [xmlFiles, setXmlFiles] = useState([]);
  const [mesa2File, setMesa2File] = useState(null);
  const [mesa3File, setMesa3File] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleXMLUpload = (event) => {
    setXmlFiles(Array.from(event.target.files));
  };

  const handleXLSUpload = (event, mesa) => {
    if (mesa === 2) {
      setMesa2File(event.target.files[0]);
    } else if (mesa === 3) {
      setMesa3File(event.target.files[0]);
    }
  };

  const parseXML = (xmlString) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const memberDataElements = xmlDoc.getElementsByTagName("MEMBER_DATA");
    
    return Array.from(memberDataElements)
      .map(member => ({
        type: member.getElementsByTagName("TYPE")[0]?.textContent || '',
        name: member.getElementsByTagName("NAME")[0]?.textContent || '',
        description: member.getElementsByTagName("DESCRIPTION")[0]?.textContent || '',
        length: parseFloat(member.getElementsByTagName("LENGTH")[0]?.textContent || '0'),
        units: member.getElementsByTagName("LENGTH")[0]?.getAttribute("UNITS") || ''
      }))
      .filter(item => !item.type.toLowerCase().includes('plate') && !item.description.toLowerCase().includes('plate'));
  };

  const convertLength = (inches) => {
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    const wholeInches = Math.floor(remainingInches);
    const fraction = remainingInches - wholeInches;
    const sixteenths = Math.round(fraction * 16);
    
    return `${feet}-${wholeInches}-${sixteenths}`;
  };

  const summarizeXMLData = (xmlData) => {
    const summary = {
      studs: {},
      kingStuds: {},
      jacks: {},
      headers: {}
    };

    Object.values(xmlData).forEach(fileData => {
      fileData.forEach(item => {
        const length = item.convertedLength;
        if (item.type.toUpperCase() === 'STUD') {
          summary.studs[length] = (summary.studs[length] || 0) + 1;
        } else if (item.type.toUpperCase() === 'KING STUD') {
          summary.kingStuds[length] = (summary.kingStuds[length] || 0) + 1;
        } else if (item.type.toUpperCase() === 'JACK') {
          summary.jacks[length] = (summary.jacks[length] || 0) + 1;
        } else if (item.type.toUpperCase() === 'HEADER') {
          summary.headers[length] = (summary.headers[length] || 0) + 1;
        }
      });
    });

    return summary;
  };

  const processData = async () => {
    setIsProcessing(true);
    const xmlData = {};
    let mesa2Data = [];
    let mesa3Data = [];

    // Process XML files
    for (let file of xmlFiles) {
      const content = await file.text();
      const pathParts = file.webkitRelativePath.split('/');
      const jobNumber = pathParts[pathParts.length - 2];
      const fileData = parseXML(content);

      if (!xmlData[jobNumber]) {
        xmlData[jobNumber] = [];
      }
      xmlData[jobNumber] = xmlData[jobNumber].concat(fileData.map(item => ({
        ...item,
        convertedLength: convertLength(item.length)
      })));
    }

    // Process Mesa 2 XLS file
    if (mesa2File) {
      const data = await readXLSFile(mesa2File);
      mesa2Data = data.slice(1).map(row => ({
        orderId: row[0],
        bundle: row[1],
        LF: row[2]?.includes('/') ? row[2].split('/')[1].trim() : row[2]
      }));
    }

    // Process Mesa 3 XLS file
    if (mesa3File) {
      const data = await readXLSFile(mesa3File);
      mesa3Data = data.slice(1).map(row => ({
        job: row[0],
        bundle: row[1],
        panels: row[2]?.includes('/') ? row[2].split('/')[1].trim() : row[2]
      }));
    }

    // Match jobs and summarize data
    const matchedJobs = {};
    mesa2Data.forEach(item => {
      if (xmlData[item.orderId]) {
        matchedJobs[item.orderId] = {
          xmlData: xmlData[item.orderId],
          mesa2: item,
          summary: summarizeXMLData({ [item.orderId]: xmlData[item.orderId] })
        };
      }
    });

    setProcessedData({
      matchedJobs,
      mesa2Data,
      mesa3Data
    });
    setIsProcessing(false);
  };

  const readXLSFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_json(firstSheet, {header: 1}));
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Multi-File XML and XLS Parser</h2>
      
      {/* File inputs */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Upload XML Files</h3>
        <input
          type="file"
          webkitdirectory="true"
          directory="true"
          multiple
          onChange={handleXMLUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Upload Mesa 2 XLS File</h3>
        <input
          type="file"
          accept=".xls,.xlsx"
          onChange={(e) => handleXLSUpload(e, 2)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Upload Mesa 3 XLS File</h3>
        <input
          type="file"
          accept=".xls,.xlsx"
          onChange={(e) => handleXLSUpload(e, 3)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* Process button */}
      <div className="mb-4">
        <button
          onClick={processData}
          disabled={isProcessing || (xmlFiles.length === 0 && !mesa2File && !mesa3File)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Process Data'}
        </button>
      </div>
      
      {/* Processed Data Display */}
      {processedData && (
        <div>
          <h3 className="text-xl font-bold mb-2">Processed Data</h3>
          
          {/* Matched Jobs and Summaries */}
          {Object.entries(processedData.matchedJobs).map(([jobNumber, data]) => (
            <div key={jobNumber} className="mb-8 p-4 border border-gray-300 rounded">
              <h4 className="text-lg font-semibold mb-2">Job #: {jobNumber}</h4>
              
              {/* Summary */}
              <div className="mb-4">
                <h5 className="text-md font-semibold mb-2">Summary</h5>
                {Object.entries(data.summary).map(([type, lengths]) => (
                  <div key={type} className="mb-2">
                    <h6 className="font-semibold">{type.charAt(0).toUpperCase() + type.slice(1)}:</h6>
                    <ul>
                      {Object.entries(lengths).map(([length, count]) => (
                        <li key={length}>{length}: {count}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              
              {/* Mesa 2 Data for this job */}
              <div className="mb-4">
                <h5 className="text-md font-semibold mb-2">Mesa 2 Data</h5>
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2">Bundle</th>
                      <th className="border border-gray-300 p-2">LF</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-2">{data.mesa2.bundle}</td>
                      <td className="border border-gray-300 p-2">{data.mesa2.LF}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          
          {/* Mesa 3 Data */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-2">Mesa 3 Data</h4>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2">Job</th>
                  <th className="border border-gray-300 p-2">Bundle</th>
                  <th className="border border-gray-300 p-2">Panels</th>
                </tr>
              </thead>
              <tbody>
                {processedData.mesa3Data.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2">{item.job}</td>
                    <td className="border border-gray-300 p-2">{item.bundle}</td>
                    <td className="border border-gray-300 p-2">{item.panels}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default XMLParser;