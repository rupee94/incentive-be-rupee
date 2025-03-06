import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Server Status')
@Controller()
export class AppController {
  constructor() {}

  @Get('/healthcheck')
  getHello(): string {
    return `The server is healthy`;
  }

  @Get('/version')
  version(): string {
    const packageJson = require('../package.json');
    return packageJson.version.trim();
  }

  @Get('/status')
  status() {
    const memoryUsage = process.memoryUsage();

    const memoryUsageJson = {
      rss: (memoryUsage.rss / 1024 / 1024).toFixed(2) + ' MB',
      heapTotal: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
      heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
      external: (memoryUsage.external / 1024 / 1024).toFixed(2) + ' MB',
      heapLimit:
        (
          require('v8').getHeapStatistics().heap_size_limit /
          1024 /
          1024
        ).toFixed(2) + 'MB',
    };

    return memoryUsageJson;
  }
}
