import fs from "fs";

export const readLogs = (path: any): any[] => {
  try {
    const data = fs.readFileSync(path, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

export const writeLog = (newLog: any, path: any) => {
  const logs = readLogs(path);
  logs.push(newLog);
  fs.writeFileSync(path, JSON.stringify(logs, null, 2), "utf-8");
};
