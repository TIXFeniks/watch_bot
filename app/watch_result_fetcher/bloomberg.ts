import * as rp from 'request-promise-native';
import * as config from 'config';
import * as urljoin from 'url-join';
import logger from '../logger/default';
import {IWatchResultFetcher, IFetcherApiResult} from './interfaces';
import cheerio from 'cheerio';

export class BloombergFetcher implements IWatchResultFetcher{
    /**
     * checks the web page for new links and returns them as a result
     * @param  {string} url
     * @returns Promise
     */
    public async check(url: string): Promise<IFetcherApiResult> {
        const options: rp.RequestPromiseOptions = {
            json: false
        };

        const path: string = urljoin(url);

        logger.debug('requesting to ' + path);

        const body: string = (await rp.get(path, options)).result;
        logger.trace('responded body is: ' + body);

        console.log(cheerio);
        const $ = cheerio.load(body);
        const links: Array<{meta: {[key: string]: any}}> = [];
        $('a').each((i, el) => {
            links.push({meta:{url: el.attribs.href}});
        });
        logger.debug(links);

        return {message: 'links', entities: links};
    }
}