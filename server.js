import express from 'express'

import { router } from './routes/health/health.routes.js'
import { uischemaRouter } from './routes/uischema/uischema.routes.js'
import { router as configRouter }  from './routes/config/config.routes.js'
import winston from 'winston'
import expressWinston from 'express-winston'
import {router as discoveryRouter} from './routes/discovery/router.js'
const app = express()
app.use(express.json())
export const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // adds color to level
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ level, message, timestamp }) => {
          return `[${timestamp}] ${level}: ${message}`;
        })
      )
    })
  ]
});

// Request logger
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true, // Log metadata about the request
  msg: "HTTP {{req.method}} {{req.url}}", // Customize the log message
  expressFormat: true, // Use Express-style format
  colorize: true, // Colorize the output
}));

app.use('/health', router)
app.use(uischemaRouter)
app.use(configRouter)
app.use(discoveryRouter)

app.listen(3080, () => {
    console.log('Server started on port 3080')
})
