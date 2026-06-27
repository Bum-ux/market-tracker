import { Controller, Get, BadRequestException, Query} from "@nestjs/common";
import { MarketService } from "./market.service";

@Controller('market')
export class MarketController{
    constructor(private readonly marketService: MarketService){}    
    @Get('cryptoData')
    async getCryptoAPI(){
        const cryptoData = await this.marketService.fetchCryptoData()
        return {success: true, data: cryptoData}
    }
}