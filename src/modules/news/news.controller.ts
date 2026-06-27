import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController{
    constructor(private readonly newsService: NewsService){}
    @Get('rss')
    async getRssData(@Query('url') url:string){
        if (!url){
            throw new BadRequestException('Cần truyền url vào!')
        }
        const newsData = await this.newsService.fetchNews(url)
        return {success: true, count:newsData.length, data: newsData}
    }
}
