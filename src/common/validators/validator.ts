import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'isValidRating', async: false })
export class IsValidRating implements ValidatorConstraintInterface {
  validate(rating: number) {
    // 0.0, 0.5, 1.0, 1.5, 2.0, 2.5, ... 5.0만 허용
    return rating >= 0.0 && rating <= 5.0 && (rating * 2) % 1 === 0;
  }

  defaultMessage() {
    return '별점은 0.5 단위로만 입력 가능합니다 (0 ~ 5.0)';
  }
}
