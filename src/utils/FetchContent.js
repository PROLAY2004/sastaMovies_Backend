import axios from 'axios';
import configuration from '../config/config.js';

export default class FetchContent {
  getData = async (imdbLink) => {
    const imdbId = imdbLink.split('/title/')[1].split('/')[0];
    const imdbApi = `https://www.omdbapi.com/?i=${imdbId}&apikey=${configuration.IMDB_API_KEY}`;
    const data = await axios.get(imdbApi);

    return { imdbId, data };
  };

  fetchMovie = async (imdbLink) => {
    const { imdbId, movieData } = this.getData(imdbLink);

    if (movieData.data.Type !== 'movie') {
      throw new Error('Please try to add a movie.');
    }

    return { imdbId, movieData };
  };

  fetchSeries = async (imdbLink) => {
    const { imdbId, seriesData } = this.getData(imdbLink);

    if (seriesData.data.Type !== 'series') {
      throw new Error('Please try to add a series.');
    }

    return { imdbId, seriesData };
  };
}
