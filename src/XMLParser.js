import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';

const XMLParser = () => {
  // ... (previous code remains the same)

  const updateSummaries = useCallback((newParsedData) => {
    const newSummaries = { 
      mesa2: { totalStuds: 0, totalKings: 0, totalHeaders330: 0, totalJacks696: 0 },
      mesa3: { totalStuds: 0, totalKings: 0, totalHeaders330: 0, totalJacks696: 0 }
    };

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
  }, [jobGroups]);

  const handleXMLUpload = useCallback(async (event) => {
    const files = event.target.files;
    if (!files) return;

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
  }, [parseXML, updateSummaries]);

  const handleExcelUpload = useCallback((mesa) => (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      setJobGroups(prevJobGroups => {
        const newJobGroups = { ...prevJobGroups };
        if (mesa === 'mesa2') {
          newJobGroups.mesa2 = json.map(row => row['C']?.toString() || '');
        } else if (mesa === 'mesa3') {
          newJobGroups.mesa3 = json.map(row => row['B']?.toString() || '');
        }
        return newJobGroups;
      });

      updateSummaries(parsedData);
    };
    reader.readAsArrayBuffer(file);
  }, [parsedData, updateSummaries]);

  // ... (rest of the component code)

  return (
    // ... (JSX remains the same)
  );
};

export default XMLParser;
