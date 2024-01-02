import 'dotenv/config'
import fs from 'fs'

const environmentFile = `export const env = {
  apiUrl: '${process.env.API_URL}',
  nodeEnv: '${process.env.NODE_ENV}',
};
`

fs.writeFile('./src/utils/env.ts', environmentFile, function (err) {
  if (err) {
    throw console.error(err)
  } else {
    console.log('Ionic env.ts file generated')
  }
})
