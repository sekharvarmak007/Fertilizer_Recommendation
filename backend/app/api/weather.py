import httpx
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import settings

router = APIRouter()

WEATHER_IMPACT_RULES = [
    {
        'condition': lambda d: d.get('rainfall', 0) > 10,
        'factor': 'Fertilizer Timing',
        'status': 'warning',
        'message': 'Rainfall detected. Delay urea application by 2–3 days to avoid nutrient leaching.'
    },
    {
        'condition': lambda d: d.get('humidity', 0) > 70,
        'factor': 'Application Method',
        'status': 'good',
        'message': 'High humidity is ideal for foliar spray. Apply early morning or late evening.'
    },
    {
        'condition': lambda d: d.get('humidity', 0) > 70,
        'factor': 'Disease Risk',
        'status': 'warning',
        'message': f'High humidity increases fungal disease risk. Monitor plants regularly.'
    },
    {
        'condition': lambda d: d.get('temperature', 25) > 35,
        'factor': 'Heat Stress',
        'status': 'warning',
        'message': 'High temperatures may cause nitrogen volatilization. Apply fertilizer in evening.'
    },
    {
        'condition': lambda d: d.get('rainfall', 0) > 5,
        'factor': 'Irrigation',
        'status': 'good',
        'message': 'Recent rainfall reduces irrigation requirement. Monitor soil moisture before next cycle.'
    },
    {
        'condition': lambda d: d.get('wind_speed', 0) > 20,
        'factor': 'Spray Application',
        'status': 'warning',
        'message': 'High wind speeds. Avoid foliar spray application to prevent drift.'
    },
]


class WeatherInput(BaseModel):
    city: str = "Hyderabad"
    lat: Optional[float] = None
    lon: Optional[float] = None


@router.post("/weather")
async def get_weather(data: WeatherInput):
    """Fetch real-time weather data and agricultural impact analysis."""
    api_key = settings.openweathermap_api_key.strip()

    if not api_key or api_key == "your_openweathermap_api_key_here":
        raise HTTPException(
            status_code=503,
            detail="Live weather is unavailable. Configure a valid OPENWEATHERMAP_API_KEY in backend/.env.",
        )

    weather_data = None
    try:
        if data.lat is not None and data.lon is not None:
            url = f"https://api.openweathermap.org/data/2.5/weather?lat={data.lat}&lon={data.lon}&appid={api_key}&units=metric"
        else:
            url = f"https://api.openweathermap.org/data/2.5/weather?q={data.city}&appid={api_key}&units=metric"

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)

        if response.status_code == 401:
            raise HTTPException(status_code=503, detail="OpenWeather rejected the API key. Check OPENWEATHERMAP_API_KEY in backend/.env.")
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail=f"No weather location was found for '{data.city}'.")
        if response.status_code != 200:
            raise HTTPException(status_code=503, detail=f"OpenWeather request failed with status {response.status_code}.")

        raw = response.json()
        weather_data = {
            "city": raw.get("name", data.city),
            "country": raw.get("sys", {}).get("country", ""),
            "temperature": round(raw["main"]["temp"], 1),
            "feels_like": round(raw["main"]["feels_like"], 1),
            "humidity": raw["main"]["humidity"],
            "rainfall": round(raw.get("rain", {}).get("1h", 0), 1),
            "wind_speed": round(raw["wind"]["speed"] * 3.6, 1),  # m/s -> km/h
            "wind_direction": _wind_dir(raw["wind"].get("deg", 0)),
            "pressure": raw["main"]["pressure"],
            "visibility": round(raw.get("visibility", 10000) / 1000, 1),
            "description": raw["weather"][0]["description"].title(),
            "icon": raw["weather"][0]["icon"],
        }
    except HTTPException:
        raise
    except (httpx.HTTPError, KeyError, TypeError, ValueError) as e:
        print(f"[Weather] API error: {e}")
        raise HTTPException(status_code=503, detail="Live weather could not be retrieved. Check the API key and network connection.")

    # Generate agricultural impact
    impact = []
    for rule in WEATHER_IMPACT_RULES:
        if rule['condition'](weather_data):
            impact.append({
                'factor': rule['factor'],
                'status': rule['status'],
                'message': rule['message'],
            })

    if not impact:
        impact.append({
            'factor': 'Overall Conditions',
            'status': 'good',
            'message': 'Weather conditions are favorable for fertilizer application.'
        })

    weather_data['impact'] = impact
    return weather_data


def _wind_dir(deg: float) -> str:
    dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
            'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    return dirs[int((deg + 11.25) / 22.5) % 16]
