import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { QueryCalendarMemoDto } from './query-calendar-memo.dto';

// main.ts의 ValidationPipe와 같은 옵션으로 쿼리스트링을 변환
const parse = (query: Record<string, string>) => {
  const dto = plainToInstance(QueryCalendarMemoDto, query, { enableImplicitConversion: true });
  return { dto, errors: validateSync(dto, { whitelist: true }) };
};

describe('QueryCalendarMemoDto', () => {
  it('year/month 문자열을 숫자로 변환한다', () => {
    const { dto, errors } = parse({ year: '2026', month: '10' });

    expect(errors).toHaveLength(0);
    expect(dto.year).toBe(2026);
    expect(dto.month).toBe(10);
  });

  it('범위를 벗어난 month는 거부한다', () => {
    expect(parse({ month: '13' }).errors).not.toHaveLength(0);
  });

  it('hasNotification=false는 false가 된다', () => {
    expect(parse({ hasNotification: 'false' }).dto.hasNotification).toBe(false);
  });

  // ─── 회귀 방지 (과거 버그) ─────────────────────────────────────────────
  // enableImplicitConversion이 먼저 'true' → true로 바꾼 뒤 @Transform의 value === 'true'가 false를 만든다.

  it('[회귀] hasNotification=true는 true가 되어야 한다', () => {
    expect(parse({ hasNotification: 'true' }).dto.hasNotification).toBe(true);
  });
});
