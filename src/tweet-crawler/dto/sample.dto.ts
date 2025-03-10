import { ApiProperty } from '@nestjs/swagger';

export class SampleDto {
  @ApiProperty({
    required: true,
    description: 'sample',
  })
  sample: string;
}
