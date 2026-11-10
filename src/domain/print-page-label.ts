export const printPageLabel = (pageNumber: number, pageCount: number) =>
  pageCount === 1 ? 'Печать страницы' : `Печать страницы ${pageNumber}`;
