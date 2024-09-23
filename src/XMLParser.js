import React, { useState } from 'react';

const XMLParser = () => {
  const [parsedData, setParsedData] = useState([]);

  const parseXML = (xmlString) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const memberDataElements = xmlDoc.getElementsByTagName("MEMBER_DATA");
    
    const extractedData = Array.from(memberDataElements).map(member => ({
      type: member.getElementsByTagName("TYPE")[0]?.textContent || '',
      name: member.getElementsByTagName("NAME")[0]?.textContent || '',
      description: member.getElementsByTagName("DESCRIPTION")[0]?.textContent || '',
      length: member.getElementsByTagName("LENGTH")[0]?.textContent || '',
      units: member.getElementsByTagName("LENGTH")[0]?.getAttribute("UNITS") || ''
    }));

    setParsedData(extractedData);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => parseXML(e.target.result);
      reader.readAsText(file);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">XML Parser</h2>
      <div className="mb-4">
        <input
          type="file"
          accept=".xml"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>
      {parsedData.length > 0 && (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2">Type</th>
              <th className="border border-gray-300 p-2">Name</th>
              <th className="border border-gray-300 p-2">Description</th>
              <th className="border border-gray-300 p-2">Length</th>
            </tr>
          </thead>
          <tbody>
            {parsedData.map((item, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2">{item.type}</td>
                <td className="border border-gray-300 p-2">{item.name}</td>
                <td className="border border-gray-300 p-2">{item.description}</td>
                <td className="border border-gray-300 p-2">{`${item.length} ${item.units}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default XMLParser;
