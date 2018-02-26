export interface IFetchedEntity {
    meta: {[key: string]: any};
}

export interface IFetcherApiResult {
    message: string;
    entities: IFetchedEntity[];
}

export interface IWatchResultFetcher {
    check(url: string): Promise<IFetcherApiResult>;
}