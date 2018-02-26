import {HyperlinkFetcher} from '../watch_result_fetcher/hyperlink';
import DefaultWatcher from './default';
import * as config from 'config';

export default class BloombergWatcher extends DefaultWatcher {
    constructor(
        watchUrl: string,
        watchInterval: string = config.get('general.defaultCronTime')
    ) {
        super(watchUrl, watchInterval, new HyperlinkFetcher(new RegExp('^/news')), true, 'url');
    }
}