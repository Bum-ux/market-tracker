import { Injectable } from "@nestjs/common";
import Parser from "rss-parser";

@Injectable()
export class NewsService{
    private parser = new Parser()
    async fetchNews(url: string){
        try{
            const newFeed = await this.parser.parseURL(url);
            return newFeed.items.map(item => ({
                title: item.title,
                link: item.link,
                pubDate: item.pubDate,
                contentSnipet: item.contentSnippet
            }))
        }catch(error){
            if(error instanceof Error) {
                throw new Error(`Lỗi RSS: ${error.message}`)
            }
            throw new Error ('Lỗi không xác định')
        }
    }
}