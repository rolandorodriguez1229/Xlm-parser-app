import React, { useState } from 'react';

const XMLParser = () => {
  const [parsedData, setParsedData] = useState({});
  const [summary, setSummary] = useState([]);

  const convertLength = (inches) => {
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    const wholeInches = Math.floor(remainingInches);
    const fraction = remainingInches - wholeInches;
    const sixteenths = Math.round(fraction * 16);
    
    return `${feet}-${wholeInches}-${sixteenths}`;
  };

  // ... (otras funciones permanecen iguales)

  const getStudSummary = (fileData) => {
    const studLengths = fileData
      .filter(item => item.type.toUpperCase() === 'STUD')
      .map(stud => {
        const convertedLength = convertLength(stud.length);
        const description = stud.description.split(' ')[0];  // Toma solo la primera palabra de la descripción
        return `${convertedLength} ${description}`;
      })
      .filter((value, index, self) => self.indexOf(value) === index)  // Elimina duplicados
      .join(', ');

    return studLengths ? `(${studLengths})` : '';
  };

  // ... (resto del código permanece igual)

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