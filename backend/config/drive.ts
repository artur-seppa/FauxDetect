import { defineConfig, services } from '@adonisjs/drive'
import { InferDriveDisks } from '@adonisjs/drive/types'
import app from '@adonisjs/core/services/app'

const driveConfig = defineConfig({
  default: 'fs',
  services: {
    fs: services.fs({
      location: app.makePath('storage'),
      serveFiles: true,
      routeBasePath: '/uploads',
      visibility: 'private',
    }),
  },
})

export default driveConfig

declare module '@adonisjs/drive/types' {
  export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}
