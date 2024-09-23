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

  const parseXML = (xmlString) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const memberDataElements = xmlDoc.getElementsByTagName("MEMBER_DATA");
    
    const extractedData = Array.from(memberDataElements)
      .map(member => ({
        type: member.getElementsByTagName("TYPE")[0]?.textContent || '',
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
      if (typeOrderA !== -1 && typeOrderB !== -1) {
        if (typeOrderA !== typeOrderB) return typeOrderA - typeOrderB;
      } else if (typeOrderA !== -1) {
        return -1;
      } else if (typeOrderB !== -1) {
        return 1;
      }
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return b.length - a.length;
    });
  };

  const updateSummary = (newParsedData) => {
    const newSummary = {
      studs: {},
      kingStuds: {},
      totalHeaders330: 0,
      totalJacks696: 0
    };

    Object.values(newParsedData).forEach(jobData => {
      Object.values(jobData).forEach(fileData => {
        fileData.forEach(item => {
          if (item.type.toUpperCase() === 'STUD') {
            if (!newSummary.studs[item.convertedLength]) {
              newSummary.studs[item.convertedLength] = 0;
            }
            newSummary.studs[item.convertedLength] += item.count;
          } else if (item.type.toUpperCase() === 'KING STUD') {
            if (!newSummary.kingStuds[item.convertedLength]) {
              newSummary.kingStuds[item.convertedLength] = 0;
            }
            newSummary.kingStuds[item.convertedLength] += item.count;
          } else if (item.type.toUpperCase() === 'HEADER' && item.convertedLength === '3-3-0') {
            newSummary.totalHeaders330 += item.count;
          } else if (item.type.toUpperCase() === 'JACK' && item.convertedLength === '6-9-6') {
            newSummary.totalJacks696 += item.count;
          }
        });
      });
    });

    setSummary(newSummary);
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
      
      {/* Summary Display */}
      {Object.keys(summary).length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-2">Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-lg font-semibold mb-2">Studs</h4>
              <ul>
                {Object.entries(summary.studs).map(([length, count]) => (
                  <li key={length}>{length}: {count}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2">King Studs</h4>
              <ul>
                {Object.entries(summary.kingStuds).map(([length, count]) => (
                  <li key={length}>{length}: {count}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4">
            <p>Total Headers (3-3-0): {summary.totalHeaders330}</p>
            <p>Total Jacks (6-9-6): {summary.totalJacks696}</p>
          </div>
        </div>
      )}
      
      {/* Parsed XML Data Display */}
      {Object.keys(parsedData).length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-2">Parsed XML Data</h3>
          {Object.entries(parsedData).map(([jobNumber, jobData]) => (
            <div key={jobNumber} className="mb-4">
              <h4 className="text-lg font-semibold mb-2">Job Number: {jobNumber}</h4>
              {Object.entries(jobData).map(([fileName, fileData]) => (
                <div key={fileName} className="mb-2">
                  <h5 className="text-md font-semibold mb-1">File: {fileName}</h5>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2">Type</th>
                        <th className="border border-gray-300 p-2">Length</th>
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
          ))}
        </div>
      )}
      
      {/* Mesa 2 Data Display */}
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
      
      {/* Mesa 3 Data Display */}
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
