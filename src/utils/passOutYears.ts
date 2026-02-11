export const generatePassOutYears = (
  startYear = 1990,
  futureOffset = 5
): number[] => {
  const currentYear = new Date().getFullYear();
  const endYear = currentYear + futureOffset;

  const years: number[] = [];
  for (let year = startYear; year <= endYear; year++) {
    years.push(year);
  }

  return years;
};
