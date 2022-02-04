import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  MetricEntity,
  MetricParams,
  Resolution,
} from '../entity/analytics.entity';
import { AnalyticsService } from '../service/analytics.service';
import { enumFromStringValue } from 'src/utils';
import { RolesDecorator } from 'src/role/role.decorator';
import { Roles } from 'src/role/entities/role.entity';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/role/role.guard';

@Controller('analytics')
export class AnalyticsController {
  defaultResolution = Resolution.Day;

  constructor(private analyticsService: AnalyticsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.admin)
  @Get('sales/priceVolume/snapshot')
  async salesPriceVolume(@Query('resolution') resolutionStr?: string) {
    const params = this.#queryParamsToMetricParams(resolutionStr);
    return await this.analyticsService.getSnapshotSalesPriceVolume(params);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.admin)
  @Get('sales/nftCount/snapshot')
  async salesNftCount(@Query('resolution') resolutionStr?: string) {
    const params = this.#queryParamsToMetricParams(resolutionStr);
    return await this.analyticsService.getSnapshotSalesNftCount(params);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.admin)
  @Get('sales/priceVolume/timeseries')
  async timeseriesSalesPriceVolume(
    @Query('resolution') resolutionStr?: string,
  ): Promise<{ data: MetricEntity[] }> {
    const params = this.#queryParamsToMetricParams(resolutionStr);

    if (params.resolution === Resolution.Infinite) {
      throw new HttpException(
        'Bad resolution parameter',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      data: await this.analyticsService.getTimeseriesSalesPriceVolume(params),
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.admin)
  @Get('sales/nftCount/timeseries')
  async timeseriesSalesNftCount(
    @Query('resolution') resolutionStr?: string,
  ): Promise<{ data: MetricEntity[] }> {
    const params = this.#queryParamsToMetricParams(resolutionStr);

    if (params.resolution === Resolution.Infinite) {
      throw new HttpException(
        'Bad resolution parameter',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      data: await this.analyticsService.getTimeseriesSalesNftCount(params),
    };
  }

  #queryParamsToMetricParams(resolutionStr?: string): MetricParams {
    const resolution = this.#parseResolution(resolutionStr);
    if (typeof resolution === 'undefined') {
      throw new HttpException(
        'Bad resolution parameter',
        HttpStatus.BAD_REQUEST,
      );
    }
    return <MetricParams>{
      resolution: resolution || Resolution.Hour,
    };
  }

  #parseResolution(resolutionStr?: string): Resolution | undefined {
    if (typeof resolutionStr === 'undefined') {
      return this.defaultResolution;
    }
    return enumFromStringValue(Resolution, resolutionStr);
  }
}