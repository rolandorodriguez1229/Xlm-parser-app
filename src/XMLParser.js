import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <h2 className="text-2xl font-bold">XML Parser</h2>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <input
            type="file"
            accept=".xml"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button as="span">Cargar archivo XML</Button>
          </label>
        </div>
        {parsedData.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Length</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsedData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{`${item.length} ${item.units}`}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default XMLParser;
