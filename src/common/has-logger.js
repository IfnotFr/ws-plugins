import { createLogger, transports, format } from 'winston'

const { combine, timestamp, printf, colorize } = format

export default {
  createLogger: ({level = 'info'} = {}) => {
    const logger = createLogger({
      level,
      transports: []
    })

    if (process.env.NODE_ENV !== 'production') {
      const myFormat = printf(({ level, message, timestamp, plugin }) => {
        const date = new Date(timestamp).toTimeString().split(' ')[0]
        const prefix = plugin ? '[ws-plugins-' + plugin + ']' : '[ws-plugins]'
        return date + ' ' + prefix + ' ' + level + ': ' + message
      })

      logger.add(new transports.Console({
        format: combine(
          colorize(),
          timestamp(),
          myFormat
        )
      }))
    }

    return logger
  }
}