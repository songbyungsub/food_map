// 광화문EAST(지도 기준점) 정보. 환경변수로 덮어쓸 수 있습니다.
// 기본값: KT광화문빌딩East (서울특별시 종로구 종로3길 33)
export const COMPANY_CENTER = {
  lat: Number(process.env.NEXT_PUBLIC_COMPANY_LAT) || 37.5720029,
  lng: Number(process.env.NEXT_PUBLIC_COMPANY_LNG) || 126.9788194,
};

export const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME || "KT광화문빌딩East";
export const COMPANY_ADDRESS =
  process.env.NEXT_PUBLIC_COMPANY_ADDRESS || "서울특별시 종로구 종로3길 33";
