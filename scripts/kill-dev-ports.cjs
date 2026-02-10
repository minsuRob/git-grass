/**
 * dev 서버 포트(3001, 8081, 8082)를 사용 중인 프로세스를 종료합니다.
 * pnpm dev 실행 전에 호출됩니다.
 */
const { execSync } = require("child_process");

const PORTS = [3001, 8081, 8082]; // api, front, rn

for (const port of PORTS) {
  try {
    const pids = execSync(`lsof -ti:${port}`, { encoding: "utf8" }).trim();
    if (pids) {
      execSync(`kill -9 ${pids}`);
      console.log(`[kill-dev-ports] Cleared port ${port}`);
    }
  } catch {
    // lsof는 해당 포트에 프로세스가 없으면 exit 1
  }
}
