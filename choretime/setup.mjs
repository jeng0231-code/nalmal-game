// setup.mjs — 설치 등록. 이름·연락처·주소·라이선스 서버 주소를 입력받아 license.json 으로 저장한다.
// 저장 후 서버(시작.bat)가 이 정보로 등록하고, 관리자가 승인해야 화면이 열린다.
import readline from 'node:readline'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const file = join(here, 'license.json')
const cur = existsSync(file)
  ? (() => { try { return JSON.parse(readFileSync(file, 'utf8').replace(/^﻿/, '')) } catch { return {} } })()
  : {}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = (q, def) =>
  new Promise((r) => rl.question(def ? `${q} [${def}]: ` : `${q}: `, (a) => r((a || '').trim() || def || '')))

console.log('\n=======================================')
console.log('   축사 모니터 설치 등록')
console.log('   (관리자 승인 후 이용할 수 있습니다)')
console.log('=======================================\n')

const server = await ask('1) 라이선스 서버 주소', cur.server || 'https://ct-deploy.up.railway.app')
const name = await ask('2) 농장/사용자 이름', cur.name)
const contact = await ask('3) 연락처(휴대폰)', cur.contact)
const address = await ask('4) 주소', cur.address)

writeFileSync(file, JSON.stringify({ server: server.replace(/\/+$/, ''), name, contact, address }, null, 2))
console.log('\n[OK] 저장되었습니다: license.json')
console.log('     이제 시작.bat 을 실행하세요. 관리자 승인 후 화면이 열립니다.\n')
rl.close()
