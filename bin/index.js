import fs from 'fs';
import http from 'http';
import path from 'node:path';

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

const downloadFile = (fileUrl, filePath) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);

    http
      .get(fileUrl, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (error) => {
        fs.unlink(filePath, () => {
          reject(error);
        });
      });
  });
};

const downloadFiles = async (fileNames) => {
  for (const fileName of fileNames) {
    const fileUrl = `http://localhost:3000/files/${fileName}`;
    const filePath = path.join('mods', fileName);

    try {
      await downloadFile(fileUrl, filePath);
      console.log(`Downloaded file: ${fileName}`);
    } catch (error) {
      console.error(`Error downloading file: ${fileName}`, error);
    }
  }
};

const getFileNamesAndCheck = () => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/files',
    method: 'GET',
  };

  const req = http.get(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      const data = JSON.parse(responseData);
      const fileNames = data.map((file) => file.name);
      const missingFiles = fileNames.filter(
        (fileName) => !fs.existsSync(path.join('mods', fileName))
      );
      if (missingFiles.length > 0) {
        downloadFiles(missingFiles);
      } else {
        console.log('All files are up to date.');
      }
    });
  });

  req.on('error', (error) => {
    console.error(error);
  });

  req.end();
};

getFileNamesAndCheck();
