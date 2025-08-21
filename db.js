import fs from 'fs';
let parse = pkg.parse;
import pkg from 'ipaddr.js';
import readline from 'readline';

//? Fix the outrange string to int problem with conversion to int from IP
export function ipToBigInt(ip) {
  try {
    const addr = parse(ip);
    const bytes = addr.toByteArray();
    let result = 0n;
    for (const byte of bytes) result = (result << 8n) + BigInt(byte);
    return result;
  } catch { return false; }
}

//? Main function to load the database in memory [mongodb index also work]
export async function loadDatabaseStream(filePath) {
  const dbData = [];
  let lineCount = 0;

  const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: fileStream });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      dbData.push({
        ...entry,
        start_ip_int: BigInt(entry.start_ip_int?.$numberDecimal || entry.start_ip_int),
        end_ip_int: BigInt(entry.end_ip_int?.$numberDecimal || entry.end_ip_int)
      });
      lineCount++;
    } catch (err) {
      console.error(`Failed to parse line: ${err.message}`);
    }
  }
  console.log(`Total records loaded: ${lineCount.toLocaleString()}`);
  return dbData;
}