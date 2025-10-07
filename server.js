import express from 'express'

import { router } from './routes/health/health.routes.js'
import { uischemaRouter } from './routes/uischema/uischema.routes.js'
import { router as configRouter }  from './routes/config/config.routes.js'
import winston from 'winston'
import expressWinston from 'express-winston'
const app = express()

export const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
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

app.listen(3080, () => {
    console.log('Server started on port 3080')
})
