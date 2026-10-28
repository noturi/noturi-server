// 운영 서버(Docker TZ=UTC)와 같은 시간대로 테스트 — 개발 PC 시간대에 따라 날짜 계산 결과가 달라지지 않게
module.exports = () => {
  process.env.TZ = 'UTC';
};
