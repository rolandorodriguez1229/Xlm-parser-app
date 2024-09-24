import React, { useState, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';

const XMLParser = () => {
  const [parsedData, setParsedData] = useState({});
  const [summaries, setSummaries] = useState({ mesa2: {}, mesa3: {} });
  const [jobGroups, setJobGroups] = useState({ mesa2: [], mesa3: [] });

  const convertLength = useCallback((inches) => {
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    const wholeInches = Math.floor(remainingInches);
    const fraction = remainingInches - wholeInches;
    const sixteenths = Math.round(fraction * 16);
    
    return `${feet}-${wholeInches}-${sixteenths}`;
  }, []);

  const groupAndSortData = useCallback((data) => {
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
  }, [convertLength]);

  const parseXML = useCallback((xmlString) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const memberDataElements = xmlDoc.getElementsByTagName("MEMBER_DATA");
    
    const extractedData = Array.from(memberDataElements)
      .map(member => ({
        type: member.getElementsByTagName("TYPE")[0]?.textContent || '',
        description: member.getElementsByTagName("DESCRIPTION")[0]?.textContent || '',
        length: parseFloat(member.getElementsByTagName("LENGTH")[0]?.textContent || '0'),
        units: member.getElementsByTagName("LENGTH")[0]?.getAttribute("UNITS") || ''
      }))
      .filter(item => !item.type.toLowerCase().includes('plate') && !item.description.toLowerCase().includes('plate'));

    return groupAndSortData(extractedData);
  }, [groupAndSortData]);

  const updateSummaries = useCallback((newParsedData) => {
    // ... (rest of the updateSummaries function)
  }, [jobGroups]);

  const handleXMLUpload = useCallback(async (event) => {
    // ... (rest of the handleXMLUpload function)
  }, [parseXML, updateSummaries]);

  const handleExcelUpload = useCallback((mesa) => (event) => {
    // ... (rest of the handleExcelUpload function)
  }, [parsedData, updateSummaries]);

  // ... (rest of the component code)

  return (
    // ... (JSX remains the same)
  );
};

export default XMLParser;
