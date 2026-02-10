/**
 * 앱 로직보다 먼저 실행되어 루트 .env를 로드합니다.
 * (ESM에서는 import가 호이스팅되므로 index.ts에서 config()가 DB 로드보다 먼저 실행되려면 별도 파일로 분리)
 */
import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
config({ path: resolve(__dirname, "../../../.env") });
