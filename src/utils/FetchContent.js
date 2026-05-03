import axios from 'axios';
import configuration from '../config/config.js';

export default class FetchContent {
  getData = async (imdbLink) => {
    const imdbId = imdbLink.split('/title/')[1].split('/')[0];
    const imdbApi = `https://www.omdbapi.com/?i=${imdbId}&apikey=${configuration.IMDB_API_KEY}`;
    const contentData = await axios.get(imdbApi);

    return contentData;
  };

  fetchMovie = async (imdbLink) => {
    const movieData = await this.getData(imdbLink);

    if (movieData.data.Type !== 'movie') {
      throw new Error('Please try to add a movie.');
    }

    return { imdbId: movieData.data.imdbID, movieData };
  };

  fetchSeries = async (imdbLink) => {
    const seriesData = await this.getData(imdbLink);

    if (seriesData.data.Type !== 'series') {
      throw new Error('Please try to add a series.');
    }

    return { imdbId: seriesData.data.imdbID, seriesData };
  };

  fetchContent = async (imdbId) => {
    const contentData = await axios.get(
      `https://www.omdbapi.com/?i=${imdbId}&apikey=${configuration.IMDB_API_KEY}`
    );
    return contentData.data;
  };
}
