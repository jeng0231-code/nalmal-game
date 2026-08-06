# 축사 모니터 — 전용 뷰어 (Railway)

제어 PC 가 보내는 데이터를 받아 **고정 주소**로 대시보드를 보여주는 앱입니다.
(cloudflare 랜덤주소 대신, 안 바뀌는 Railway 주소로 어디서든 보기 위함.)

```
제어 PC(시작.bat) ──15초마다 push──▶ 이 뷰어(Railway) ──고정 주소──▶ 폰/PC
```

## Railway 배포 (한 번만)

1. Railway → **New Project → Deploy from GitHub repo** → `jeng0231-code/nalmal-game` 선택
2. 생성된 서비스 → **Settings → Root Directory** 를 `choretime/cloud-viewer` 로 지정
3. **Settings → Networking → Generate Domain** 눌러 공개 주소 생성
   (예: `https://ct-viewer-production-xxxx.up.railway.app`)
4. (선택) **Variables** 에 `PUSH_TOKEN` 을 원하는 값으로 지정. 기본값은 `ct-viewer-2026`.
   → 이 값을 제어 PC 의 `mapping.json` `push.viewerToken` 과 **똑같이** 맞춰야 합니다.

## 제어 PC 연결 (mapping.json)

`mapping.json` 에 아래처럼 `push` 를 넣으면, 제어 PC 가 **AI 사육 매니저 + 이 뷰어** 둘 다에 보냅니다:

```json
"push": {
  "viewerUrl": "https://ct-viewer-production-xxxx.up.railway.app/api/ct2-push",
  "viewerToken": "ct-viewer-2026"
}
```

- `viewerUrl` = 3번에서 만든 도메인 + `/api/ct2-push`
- 저장 후 `시작.bat` 재실행 → 서버 창에 `[push] 내뷰어 전송 성공` 이 뜨면 연결 완료.

## 확인

- 브라우저에서 위 Railway 도메인 접속 → 1동/2동/3동 대시보드가 보이면 성공.
- 데이터가 안 오면: 제어 PC 에서 `시작.bat` 이 켜져 있는지, `viewerToken` 이 양쪽 동일한지 확인.

## 참고

- 데이터는 마지막으로 받은 것을 메모리에 보관합니다(재배포 시 잠깐 비었다가 15초 내 다시 채워짐).
- 비밀번호 없음(링크만 알면 접속). 필요하면 추가할 수 있습니다.
