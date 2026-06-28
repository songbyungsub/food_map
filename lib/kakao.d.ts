// 카카오맵 JavaScript SDK 전역 타입 (필요한 부분만 느슨하게 선언)
declare global {
  interface Window {
    kakao: typeof kakao;
  }

  namespace kakao.maps {
    function load(callback: () => void): void;

    class LatLng {
      constructor(lat: number, lng: number);
      getLat(): number;
      getLng(): number;
    }

    class LatLngBounds {
      extend(latlng: LatLng): void;
      isEmpty(): boolean;
    }

    class Map {
      constructor(container: HTMLElement, options: { center: LatLng; level: number });
      setCenter(latlng: LatLng): void;
      getCenter(): LatLng;
      setLevel(level: number): void;
      setBounds(bounds: LatLngBounds): void;
      panTo(latlng: LatLng): void;
      relayout(): void;
    }

    class Size {
      constructor(width: number, height: number);
    }

    class Point {
      constructor(x: number, y: number);
    }

    class MarkerImage {
      constructor(src: string, size: Size, options?: { offset?: Point });
    }

    class Marker {
      constructor(options: { position: LatLng; image?: MarkerImage; title?: string; map?: Map });
      setMap(map: Map | null): void;
    }

    class InfoWindow {
      constructor(options: { content: string; removable?: boolean });
      open(map: Map, marker: Marker): void;
      close(): void;
    }

    namespace event {
      function addListener(target: unknown, type: string, handler: (...args: any[]) => void): void;
    }

    namespace services {
      class Places {
        keywordSearch(
          keyword: string,
          callback: (data: PlacesSearchResult[], status: Status) => void
        ): void;
      }

      interface PlacesSearchResult {
        id: string;
        place_name: string;
        category_name: string;
        category_group_code: string;
        phone: string;
        address_name: string;
        road_address_name: string;
        x: string; // lng
        y: string; // lat
        place_url: string;
      }

      enum Status {
        OK = "OK",
        ZERO_RESULT = "ZERO_RESULT",
        ERROR = "ERROR",
      }
    }
  }
}

export {};
