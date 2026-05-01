import axios from 'axios';
import configuration from '../config/config.js';

export default async function fetchMovie(imdbLink) {
  const imdbId = imdbLink.split('/title/')[1].split('/')[0];
  const imdbApi = `https://www.omdbapi.com/?i=${imdbId}&apikey=${configuration.IMDB_API_KEY}`;
  const movieData = await axios.get(imdbApi);

  if (movieData.data.Type !== 'movie') {
    throw new Error('Please try to add a movie.');
  }
  
  return { imdbId, movieData };
}
