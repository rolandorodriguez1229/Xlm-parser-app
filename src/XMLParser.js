import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const XMLParser = () => {
  const [parsedData, setParsedData] = useState({});
  const [summaries, setSummaries] = useState({ mesa2: {}, mesa3: {} });
  const [jobGroups, setJobGroups] = useState({ mesa2: [], mesa3: [] });

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
    const typeOrder = ['STUD', 'KING', 'JACK'];
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

  const updateSummaries = (newParsedData) => {
    const newSummaries = { mesa2: { totalStuds: 0, totalKings: 0, totalHeaders330: 0, totalJacks696: 0 },
                           mesa3: { totalStuds: 0, totalKings: 0, totalHeaders330: 0, totalJacks696: 0 } };

    Object.entries(newParsedData).forEach(([jobNumber, jobData]) => {
      const mesa = jobGroups.mesa2.includes(jobNumber) ? 'mesa2' : 'mesa3';
      Object.values(jobData).forEach(fileData => {
        fileData.forEach(item => {
          if (item.type.toUpperCase() === 'STUD') {
            newSummaries[mesa].totalStuds += item.count;
          } else if (item.type.toUpperCase() === 'KING') {
            newSummaries[mesa].totalKings += item.count;
          } else if (item.type.toUpperCase() === 'HEADER' && item.convertedLength === '3-3-0') {
            newSummaries[mesa].totalHeaders330 += item.count;
          } else if (item.type.toUpperCase() === 'JACK' && item.convertedLength === '6-9-6') {
            newSummaries[mesa].totalJacks696 += item.count;
          }
        });
      });
    });

    setSummaries(newSummaries);
  };

  const handleFileUpload = async (event) => {
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

  const handleExcelUpload = (event) => {
    const files = event.target.files;
    const newJobGroups = { mesa2: [], mesa3: [] };

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (file.name.includes('mesa2')) {
          newJobGroups.mesa2 = json.map(row => row['C'].toString());
        } else if (file.name.includes('mesa3')) {
          newJobGroups.mesa3 = json.map(row => row['B'].toString());
        }

        setJobGroups(newJobGroups);
        updateSummaries(parsedData);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Multi-File XML Parser with Excel Grouping</h2>
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
      <div className="mb-4">
        <input
          type="file"
          multiple
          accept=".xls,.xlsx"
          onChange={handleExcelUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-green-50 file:text-green-700
            hover:file:bg-green-100"
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
