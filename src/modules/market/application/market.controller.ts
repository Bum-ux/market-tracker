import { Controller, Get, BadRequestException, Query} from "@nestjs/common";
import { MarketService } from "./market.service";

@Controller('market')
export class MarketController{
    constructor(private readonly marketService: MarketService){}
    @Get('rss')
    async getRssData(@Query('url') url: string){
        if (!url){
            throw new BadRequestException('Cần truyền url!')
        }
        const data = await this.marketService.fetchRssNews(url)
        return {success: true, count: data.length, data: data}
    }
    
    @Get('cryptoData')
    async getCryptoAPI(){
        const cryptoData = await this.marketService.fetchCryptoData()
        return {success: true, data: cryptoData}
    }
}