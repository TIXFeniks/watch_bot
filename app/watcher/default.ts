import {EventEmitter} from 'events';
import {DefaultWatchResultFetcher} from '../watch_result_fetcher/default';
import {EResultWatcherEvent, IResult, IResultWatcher, IWatcherWatchData} from './interfaces';
import {IFetchedEntity, IFetcherApiResult, IWatchResultFetcher} from '../watch_result_fetcher/interfaces';
import {ResultWatcherError} from '../error/result_watcher';
import {CronJob} from 'cron';
import * as config from 'config';

export default class DefaultResultWatcher extends EventEmitter implements IResultWatcher {
    private _cronJob: CronJob;
    private _watchData: IWatcherWatchData;
    private _storage: {[key: string]: any} = {}; // TODO: add a way to clear the cache


    constructor(
        watchUrl: string,
        watchInterval: string = config.get('general.defaultCronTime'),
        protected _api: IWatchResultFetcher = new DefaultWatchResultFetcher(),
        protected _skipFirst: boolean = false,
        protected _cacheKey?: string
    ) {
        super();
        this._watchData = {
            watchUrl,
            watchInterval
        };
    }

    public getWatchData(): IWatcherWatchData {
        return this._watchData;
    }

    public async checkOnce(): Promise<IResult> {
        try {
            return await this._check();
        } catch (err) {
            throw new ResultWatcherError(err);
        }
    }

    /**
     * starts watching process
     * @returns void
     */
    public startWatching(): void {
        this._cronJob = this._cronJob || new CronJob({
            cronTime: this._watchData.watchInterval,
            onTick: this._cronTickFunc.bind(this),
            start: false
        });

        this._cronJob.start();
    }

    /**
     * stops watching process
     * @returns void,
     */
    public stopWatching(): void {
        this._cronJob.stop();
    }

    private _check(): Promise<IResult>{
        let p: Promise<IResult> = this._api.check(this._watchData.watchUrl);
        if (this._cacheKey !== undefined) {
            p = p.then((res: IResult): IResult => {
                res.entities = res.entities.filter((en: IFetchedEntity): boolean => {
                    const storageKey = en.meta[this._cacheKey];
                    const isStored: boolean = storageKey in this._storage;
                    this._storage[storageKey] = en;
                    return !isStored;
                });
                return res;
            });
        }
        return p;
    }

    private async _cronTickFunc(): Promise<void> {
        try {
            const response: IFetcherApiResult = await this._check();

            if (response.entities.length > 0) {
                if (this._skipFirst) {
                    this._skipFirst = false;
                } else {
                    this.emit(EResultWatcherEvent.NEW_RESULT, response);
                }
            }
        } catch (err) {
            this.emit(EResultWatcherEvent.ERROR, err.message);
        }
    }
}