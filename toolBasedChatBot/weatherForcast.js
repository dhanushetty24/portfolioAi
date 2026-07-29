import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const fetchWeatherData = async (city) => {
  try {
    if (city === null || city === undefined) {
      return 'City not found';
    }
    console.log(`Weather api called for ${city}...!`);
    const options = {
      method: 'GET',
      url: process.env.WEATHER_API,
      params: {
        query: city,
        access_key: process.env.WEATHER_API_KEY,
        units: 'm',
      },
      headers: { Accept: 'application/json' },
    };
    const { data } = await axios(options);
    const refinedData = {
      location: data.location.name,
      temperature: data.current.temperature,
      weatherDescription: data.current.weather_descriptions[0],
      windSpeed: data.current.wind_speed,
      humidity: data.current.humidity,
      feelsLike: data.current.feelslike,
      uvIndex: data.current.uv_index,
      visibility: data.current.visibility,
      isDay: data.current.is_day,
      precip: data.current.precip,
      pressure: data.current.pressure,
      windDirection: data.current.wind_dir,
    };
    return refinedData;
  } catch (error) {
    console.error(error.message);
  }
};

export default fetchWeatherData;
