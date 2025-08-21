import express from 'express';
import { dirname } from 'path';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
const parent_path = dirname(fileURLToPath(import.meta.url)) + '/';
const { loadDatabaseStream, ipToBigInt } = await import(parent_path + '/db.js'); //? Fix import from external services

const port = 5000;
const app = express();
const dbData = await loadDatabaseStream(parent_path + 'ipsv1.jsonl');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/', async (req, res) => { //TODO Implement try-catch handler
  const ip = req.body.ip;

  if (!ip) {
    return res.status(400).json({
      status: false,
      message: 'IP not found in body'
    });
  }

  const ip_version = ip.includes(':') ? 6 : 4;
  const ip_int = ipToBigInt(ip);

  if (ip_int === false) {
    return res.status(400).json({
      success: false,
      message: 'Bad formatting'
    });
  }

  const response = dbData.find(entry =>
    entry.ip_version === ip_version &&
    entry.start_ip_int <= ip_int &&
    entry.end_ip_int >= ip_int
  );

  if (!response) {
    return res.status(400).json({
      success: false,
      message: 'IP-data was not found (2023-Data.Version)',
      data: {}
    });
  }

  //TODO Create function to handle this (already function this)
  const temp_result = { ...response };
  
  delete temp_result.start_ip_int;
  delete temp_result.end_ip_int;
  delete temp_result._id;
  delete temp_result.start_ip;
  delete temp_result.end_ip;
  
  temp_result['ip'] = ip;

  res.status(200).json({
    success: true,
    message: 'Data provided',
    data: temp_result
  });
});

app.listen(port, () => {
  console.log(`Server started successfully [POST] http://localhost:${port}`);
  writeFileSync(parent_path + 'status.txt', 'IPDB:Running') //? Handler for external services
});


//! Handlers
process.on('SIGINT', () => {
  writeFileSync(parent_path + 'status.txt', 'IPDB:Stopped');
  process.exit();
});

process.on('SIGTERM', () => {
  writeFileSync(parent_path + 'status.txt', 'IPDB:Stopped');
  process.exit();
});

process.on('exit', () => {
  writeFileSync(parent_path + 'status.txt', 'IPDB:Stopped');
});