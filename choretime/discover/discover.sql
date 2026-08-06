-- discover.sql — 농장 C-Central DB의 "자기설명 표"를 통째로 읽는 지문(fingerprint) 쿼리.
-- 읽기(SELECT) 전용. 컨트롤러/DB에 아무것도 쓰지 않는다.
-- 결과 테이블 순서(discover.ps1 가 이름을 붙인다):
--   t0 controlUnits  t1 houseNames  t2 descriptors  t3 sampleSpecs
--   t4 templates     t5 conversions t6 units        t7 orderedText  t8 formats
-- DB 이름과 동 이름 코드는 build-mapping 이 채워 넣는다(__DB__ / __NAMECODE__).
SET NOCOUNT ON;

-- 0) 동(House) 목록
SELECT controlunitpk AS cu, alarmStatus, alarmText, currentStatus, lastUpdated
FROM __DB__.dbo.ControlUnit;

-- 1) 동 이름 (Data 의 code=__NAMECODE__ 문자열)
SELECT dp.controlunitfk AS cu, d.stringValue AS sv
FROM __DB__.dbo.Data d
JOIN __DB__.dbo.DataPlaceholder dp ON dp.dataplaceholderpk = d.dataplaceholderfk
JOIN __DB__.dbo.DataDescriptor dd ON dd.datadescriptorpk = dp.datadescriptorfk
WHERE dd.code = __NAMECODE__ AND d.index1 = 1 AND d.index2 = 1;

-- 2) 모든 데이터 항목 정의 (펌웨어 고정값: code, RAM 주소, 포맷/템플릿 링크)
--    descriptorfk(=datadescriptorpk) 는 DB마다 다르므로 code/dataDescriptorID 로 매핑한다.
SELECT * FROM __DB__.dbo.DataDescriptor;

-- 3) CSV 측정 항목 정의 (.text = 라벨, datadescriptorfk = 항목)
SELECT * FROM __DB__.dbo.SampleTaskSpec;

-- 4) 표시 템플릿 (스케일/소수점 체인의 시작)
SELECT * FROM __DB__.dbo.DataTemplate;

-- 5) 변환 정의 (소수점/자동범위 등 dt* 플래그)
SELECT * FROM __DB__.dbo.DataConversion;

-- 6) 단위/배율 (factorA/B/C)
SELECT * FROM __DB__.dbo.UnitData;

-- 7) 상태 글자 사전 (A-ON / MIN VENT / STIR 등)
SELECT * FROM __DB__.dbo.OrderedText;

-- 8) 바이트 포맷 (부호/엔디안/길이)
SELECT * FROM __DB__.dbo.DataFormat;
