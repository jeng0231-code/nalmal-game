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
console.log('=======================================')
console.log('  아래 3가지만 입력하세요. (승인 서버 주소는 자동 설정됨)\n')

const name = await ask('1) 농장/사용자 이름', cur.name)
const contact = await ask('2) 연락처(휴대폰)', cur.contact)
const address = await ask('3) 주소', cur.address)

// 서버 주소는 묻지 않는다(배포용 mapping.license.server 에 이미 심겨 있음).
// 기존 license.json 에 server 가 있으면 유지, 없으면 넣지 않음.
const out = { name, contact, address }
if (cur.server && /^https?:\/\/[^\s<>]+\.[^\s<>]+/.test(cur.server)) out.server = cur.server // 유효 URL만 유지
writeFileSync(file, JSON.stringify(out, null, 2))
console.log('\n[OK] 저장되었습니다: license.json')
console.log('     이제 시작.bat 을 실행하세요. 관리자 승인 후 화면이 열립니다.\n')
rl.close()
