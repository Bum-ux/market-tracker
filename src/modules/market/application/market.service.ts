import { Injectable } from "@nestjs/common";

@Injectable()
export class MarketService{
  async fetchCryptoData(){
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=bitcoin&x_cg_demo_api_key=${process.env.COINGECKO_API_KEY}`)
      const cryptoData = await response.json()
      return cryptoData;
    } catch(error){
      if(error instanceof Error){
        throw new Error(`API Error: ${error.message}`)
      }
      throw new Error ('Unknow error')
    }
  }
}