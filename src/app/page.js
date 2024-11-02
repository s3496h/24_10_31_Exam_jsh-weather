"use client";
import { useState } from 'react';

export default function WeatherApp() {
  const [city, setCity] = useState('');  // 도시 이름 저장
  const [weather, setWeather] = useState(null);  // 날씨 정보 저장

  // 구글 지도 API 키와 기상청 API 키를 환경 변수에서 가져옴
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const serviceKey = encodeURIComponent(process.env.NEXT_PUBLIC_WEATHER_API_KEY);

  // 한국 주요 도시의 기상청 격자 좌표 매핑
  const cityToGrid = {
    '서울': { nx: 60, ny: 127 },
    '대전': { nx: 67, ny: 100 },
    '부산': { nx: 98, ny: 76 },
    '대구': { nx: 89, ny: 90 },
    '인천': { nx: 55, ny: 124 },
    '광주': { nx: 58, ny: 74 },
    '울산': { nx: 102, ny: 84 },
    '수원': { nx: 60, ny: 121 },
  };

  const fetchCoordinates = async (city) => {
    // 미리 정의한 좌표가 있으면 해당 좌표를 사용
    if (cityToGrid[city]) {
      return cityToGrid[city];
    }

    // 구글 지오코딩 API를 사용해 도시 이름을 좌표로 변환
    const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${googleApiKey}`;
    const response = await fetch(geoUrl);
    const data = await response.json();
    const location = data.results[0]?.geometry.location;

    if (location) {
      return { nx: Math.round(location.lng), ny: Math.round(location.lat) };
    }
    return null;
  };

  const fetchWeatherData = async () => {
    if (!city) return;

    // 도시 이름을 좌표로 변환
    const coordinates = await fetchCoordinates(city);
    if (!coordinates) {
      console.error("위치를 찾을 수 없습니다.");
      return;
    }

    const { nx, ny } = coordinates;
    const baseDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const baseTime = '0600';  // 정시단위 예시로 06시 설정

    const url = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?ServiceKey=${serviceKey}&pageNo=1&numOfRows=1000&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      // 필요한 데이터만 추출하여 저장
      const weatherData = {
        temperature: data.response.body.items.item.find(item => item.category === 'T1H')?.obsrValue ?? "데이터 없음",
        humidity: data.response.body.items.item.find(item => item.category === 'REH')?.obsrValue ?? "데이터 없음",
        windSpeed: data.response.body.items.item.find(item => item.category === 'WSD')?.obsrValue ?? "데이터 없음",
      };
      
      setWeather(weatherData);
    } catch (error) {
      console.error("날씨 데이터를 가져오는 중 오류 발생:", error);
    }
  };

  return (
    <div>
      <h1>날씨 정보 앱</h1>
      <input
        type="text"
        placeholder="도시 이름 입력"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />
      <button onClick={fetchWeatherData}>날씨 조회</button>

      {weather && (
        <div>
          <h2>{city}의 날씨</h2>
          <p>온도: {weather.temperature} °C</p>
          <p>습도: {weather.humidity} %</p>
          <p>풍속: {weather.windSpeed} m/s</p>
        </div>
      )}
    </div>
  );
}