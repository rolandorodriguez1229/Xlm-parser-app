import React, { useState } from 'react';

const XMLParser = () => {
  // ... (el resto del código permanece igual)

  const getStudSummary = (fileData) => {
    const studTypes = fileData
      .filter(item => item.type.toUpperCase() === 'STUD')
      .map(stud => stud.convertedLength)
      .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
      .join(', ');
    return studTypes ? `(${studTypes})` : '';
  };

  // ... (el resto del código permanece igual)

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {/* ... (el resto del JSX permanece igual) */}
      {Object.entries(parsedData).map(([jobNumber, jobData]) => (
        <div key={jobNumber} className="mb-8">
          <h3 className="text-xl font-bold mb-2">Job Number: {jobNumber}</h3>
          {Object.entries(jobData).map(([fileName, fileData]) => (
            <div key={fileName} className="mb-4">
              <h4 className="text-lg font-semibold mb-2">
                File: {fileName} {getStudSummary(fileData)}
              </h4>
              {/* ... (el resto del JSX para la tabla permanece igual) */}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default XMLParser;