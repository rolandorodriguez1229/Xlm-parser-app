import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const XMLParser = () => {
  const [xmlFiles, setXmlFiles] = useState([]);
  const [mesa2File, setMesa2File] = useState(null);
  const [mesa3File, setMesa3File] = useState(null);
  const [combinedData, setCombinedData] = useState({});
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
      const fileName = pathParts[pathParts.length - 1];
      const fileData = parseXML(content);

      if (!xmlData[jobNumber]) {
        xmlData[jobNumber] = {};
      }
      xmlData[jobNumber][fileName] = fileData.map(item => ({
        ...item,
        convertedLength: convertLength(item.length)
      }));
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

    // Combine all data
    const combined = {};
    
    mesa2Data.forEach(item => {
      if (!combined[item.orderId]) {
        combined[item.orderId] = { mesa2: [], mesa3: [], xmlData: {} };
      }
      combined[item.orderId].mesa2.push(item);
    });
    
    mesa3Data.forEach(item => {
      if (!combined[item.job]) {
        combined[item.job] = { mesa2: [], mesa3: [], xmlData: {} };
      }
      combined[item.job].mesa3.push(item);
    });
    
    Object.entries(xmlData).forEach(([jobNumber, jobData]) => {
      if (combined[jobNumber]) {
        combined[jobNumber].xmlData = jobData;
      }
    });
    
    setCombinedData(combined);
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
      
      {/* Combined Data Display */}
      {Object.keys(combinedData).length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-2">Combined Data</h3>
          {Object.entries(combinedData).map(([jobNumber, data]) => (
            <div key={jobNumber} className="mb-8">
              <h4 className="text-lg font-semibold mb-2">Job #: {jobNumber}</h4>
              
              {/* Mesa 2 Data */}
              {data.mesa2.length > 0 && (
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
                      {data.mesa2.map((item, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 p-2">{item.bundle}</td>
                          <td className="border border-gray-300 p-2">{item.LF}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Mesa 3 Data */}
              {data.mesa3.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-md font-semibold mb-2">Mesa 3 Data</h5>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2">Bundle</th>
                        <th className="border border-gray-300 p-2">Panels</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.mesa3.map((item, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 p-2">{item.bundle}</td>
                          <td className="border border-gray-300 p-2">{item.panels}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* XML Data Summary */}
              {Object.keys(data.xmlData).length > 0 && (
                <div className="mb-4">
                  <h5 className="text-md font-semibold mb-2">XML Data Summary</h5>
                  {Object.entries(data.xmlData).map(([fileName, fileData]) => (
                    <div key={fileName} className="mb-4">
                      <h6 className="text-sm font-semibold mb-2">File: {fileName}</h6>
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-2">Type</th>
                            <th className="border border-gray-300 p-2">Length</th>
                            <th className="border border-gray-300 p-2">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fileData.map((item, index) => (
                            <tr key={index}>
                              <td className="border border-gray-300 p-2">{item.type}</td>
                              <td className="border border-gray-300 p-2">{item.convertedLength}</td>
                              <td className="border border-gray-300 p-2">{item.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default XMLParser;