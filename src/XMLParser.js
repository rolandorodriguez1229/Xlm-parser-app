import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const StudAnalyzer = () => {
  const [parsedData, setParsedData] = useState({});
  const [studSummary, setStudSummary] = useState({});

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
      .filter(item => item.type.toLowerCase() === 'stud');

    return groupAndAnalyzeStuds(extractedData);
  };

  const convertLength = (inches) => {
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    const wholeInches = Math.floor(remainingInches);
    const fraction = remainingInches - wholeInches;
    const sixteenths = Math.round(fraction * 16);
    
    return `${feet}-${wholeInches}-${sixteenths}`;
  };

  const determineStudType = (description) => {
    if (description.toLowerCase().includes('2x4')) return '2x4';
    if (description.toLowerCase().includes('2x6')) return '2x6';
    return 'other';
  };

  const groupAndAnalyzeStuds = (data) => {
    const grouped = data.reduce((acc, item) => {
      const studType = determineStudType(item.description);
      const lengthKey = convertLength(item.length);
      const groupKey = `${studType}-${lengthKey}`;
      
      if (!acc[groupKey]) {
        acc[groupKey] = {
          studType,
          length: lengthKey,
          count: 0,
          description: item.description
        };
      }
      acc[groupKey].count++;
      return acc;
    }, {});

    // Calcular totales y bundles
    const summary = {
      '2x4': {
        total: 0,
        bundles: 0,
        byLength: {}
      },
      '2x6': {
        total: 0,
        bundles: 0,
        byLength: {}
      },
      'other': {
        total: 0,
        byLength: {}
      }
    };

    Object.values(grouped).forEach(group => {
      const { studType, length, count } = group;
      summary[studType].total += count;
      
      if (!summary[studType].byLength[length]) {
        summary[studType].byLength[length] = 0;
      }
      summary[studType].byLength[length] += count;

      if (studType === '2x4') {
        summary[studType].bundles = (summary[studType].total / 294).toFixed(2);
      }
    });

    setStudSummary(summary);
    return grouped;
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    const newParsedData = {};

    for (let file of files) {
      const pathParts = file.webkitRelativePath.split('/');
      const jobNumber = pathParts[pathParts.length - 2];
      const fileName = pathParts[pathParts.length - 1];

      const content = await file.text();
      const fileData = parseXML(content, fileName);

      if (!newParsedData[jobNumber]) {
        newParsedData[jobNumber] = {};
      }
      newParsedData[jobNumber][fileName] = fileData;
    }

    setParsedData(newParsedData);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Analizador de Studs</CardTitle>
        </CardHeader>
        <CardContent>
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

          {Object.keys(studSummary).length > 0 && (
            <div className="space-y-6">
              {/* Resumen 2x4 */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-bold mb-2">Studs 2x4</h3>
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div>Total: {studSummary['2x4'].total}</div>
                  <div>Bundles (÷294): {studSummary['2x4'].bundles}</div>
                </div>
                <div className="mt-2">
                  <h4 className="font-semibold">Por medida:</h4>
                  {Object.entries(studSummary['2x4'].byLength).map(([length, count]) => (
                    <div key={length} className="grid grid-cols-2 gap-4">
                      <div>{length}</div>
                      <div>{count}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen 2x6 */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-bold mb-2">Studs 2x6</h3>
                <div className="mb-2">Total: {studSummary['2x6'].total}</div>
                <div className="mt-2">
                  <h4 className="font-semibold">Por medida:</h4>
                  {Object.entries(studSummary['2x6'].byLength).map(([length, count]) => (
                    <div key={length} className="grid grid-cols-2 gap-4">
                      <div>{length}</div>
                      <div>{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudAnalyzer;