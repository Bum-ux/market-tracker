import { Injectable } from "@nestjs/common";
import Parser from "rss-parser";

@Injectable()
export class MarketService{
  private parser = new Parser();
  async fetchRssNews(url: string){
    try{
      const feed = await this.parser.parseURL(url);
      return feed.items.map(item => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        contentSnippet: item.contentSnippet,
      }))
    } catch(error){
      if(error instanceof Error) {
        throw new Error (`Lỗi RSS: ${error.message}`)
      }
      throw new Error('Lỗi không xác định')
    }
  }
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