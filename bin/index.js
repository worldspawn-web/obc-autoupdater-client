import fs from 'fs';
import http from 'http';

const sendFileNames = (fileNames) => {
  const requestBody = JSON.stringify({ clientFiles: fileNames });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/files',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': requestBody.length,
    },
  };

  const req = http.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      const data = JSON.parse(responseData);
      console.log(data);
    });
  });

  req.on('error', (error) => {
    console.error(error);
  });

  req.write(requestBody);
  req.end();
};

const downloadFiles = (fileNames) => {
  fileNames.forEach((fileName) => {
    const fileUrl = `http://localhost:3000/files/${fileName}`;

    http.get(fileUrl, (res) => {
      const fileStream = fs.createWriteStream(fileName);
      res.pipe(fileStream);
    });
  });
};

const getFileNamesAndCheck = () => {
  http.get('http://localhost:3000/files', (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      const data = JSON.parse(responseData);
      const fileNames = data.map((file) => file.name);
      const missingFiles = fileNames.filter(
        (fileName) => !fs.existsSync(fileName)
      );
      if (missingFiles.length > 0) {
        downloadFiles(missingFiles);
      } else {
        console.log('All files are up to date.');
      }
    });
  });
};

getFileNamesAndCheck();
