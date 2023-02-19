import {ssmCredentials} from './ssm'

type Config = {
  CURIOSITY_BOT_APPLICATION_ID: string,
  CURIOSITY_BOT_TOKEN: string;
}

export const config = async (): Promise<Config> => {
  const {CURIOSITY_BOT_APPLICATION_ID, CURIOSITY_BOT_TOKEN} = 
    await ssmCredentials(['CURIOSITY_BOT_APPLICATION_ID', 'CURIOSITY_BOT_TOKEN']);

  if (!CURIOSITY_BOT_APPLICATION_ID || !CURIOSITY_BOT_TOKEN) throw new Error('Error retrieving creds')

  return {
    CURIOSITY_BOT_APPLICATION_ID: CURIOSITY_BOT_APPLICATION_ID,
    CURIOSITY_BOT_TOKEN: CURIOSITY_BOT_TOKEN,
  }
}