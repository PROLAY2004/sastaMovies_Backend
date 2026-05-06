import { google } from 'googleapis';
import configuration from '../config/config.js';

const oauth2Client = new google.auth.OAuth2(
  configuration.CLIENT_ID,
  configuration.CLIENT_SECRET,
  'postmessage'
);

export default oauth2Client;
