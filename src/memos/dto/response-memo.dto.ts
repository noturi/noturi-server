export class ResponseMemoDto {
  id: string;
  title?: string;
  content?: string;
  rating: number;
  experienceDate?: Date;
  createdAt: Date;
  updatedAt: Date;

  category: {
    id: string;
    name: string;
    color?: string;
  };
}

export class PaginatedMemosDto {
  data: ResponseMemoDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
