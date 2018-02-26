import * as rp from 'request-promise-native';
import * as config from 'config';
import * as urljoin from 'url-join';
import {URL} from 'url';
import logger from '../logger/default';
import {IWatchResultFetcher, IFetcherApiResult} from './interfaces';
import {load} from 'cheerio';

export class HyperlinkFetcher implements IWatchResultFetcher{
    /**
     * @param {string} _fetchExpr - regExp to parse
     */
    constructor(private _fetchExpr?: RegExp) {}
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

        const body: string = (await rp.get(path, options));
        if (body === undefined)
            logger.error('Resulting html is empty');
        logger.trace('responded body is: ' + body || 'undefined');

        logger.debug('Parsing the result');
        const $ = load(body);
        const links: Array<{meta: {[key: string]: any}}> = [];
        $('a').each((i, el) => {
            let localUrl = el.attribs.href;
            if (this._fetchExpr === undefined || this._fetchExpr.test(localUrl)) {
                if (localUrl.startsWith('/'))
                    localUrl = urljoin((new URL(url)).origin, localUrl);
                links.push({meta: {url: localUrl}});
            }
        });
        logger.debug(links);

        return {message: 'links', entities: links};
    }
}