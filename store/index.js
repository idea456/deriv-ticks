import React from 'react';
import { observable, action, computed, flow, makeAutoObservable, onBecomeObserved, onBecomeUnobserved, trace } from "mobx"
import { subscribe, onUpdate } from "rxjs"
import DerivAPI from "@deriv/deriv-api"
// const WebSocket = require('ws')

const APP_ID = 1089
const TOKEN = 'OtijgYJor886Iws'


export class Store {
    // observable variables
    @observable tick = {};
    @observable ticks = [];
    @observable assets = [];
    @observable current_asset = {
        name: "AUD Index",
        symbol: "WLDAUD"
    };
    @observable tickStream = null;
    @observable subscription = null;
    @observable connection = null;
    @observable current_api = null;

    // options variables
    max_history_count = 20;

    constructor() {
        makeAutoObservable(this, {
            fetchLatestTicks: flow.bound,
        })

        // onBecomeObserved(this, "tick", this.printTick)
        // onBecomeUnobserved(this, "tick", this.clearStore)
    }

    @action.bound
    unsubscribe() {
        if (this.subscription) this.subscription.unsubscribe()
    }

    @action.bound
    setTickStream(tickStream) {
        this.tickStream = tickStream
    }

    @computed
    get tick_stream() {
        return this.tickStream
    }

    @computed
    get current_connection() {
        return this.connection
    }

    @computed
    get api() {
        return this.current_api;
    }

    @action.bound
    setConnection(c) {
        this.connection = c
    }

    @action.bound
    setApi(api) {
        trace(this, "api")
        this.current_api = api
    }

    @computed
    get all_assets() {
        return this.assets;
    }

    @action.bound
    setAssets(assets) {
        this.assets = assets;
    }

    @computed
    get asset() {
        trace()
        return this.current_asset;
    }

    @action.bound
    setAsset(asset) {
        this.current_asset = asset;
    }

    @computed
    get all_ticks() {
        return this.ticks;
    }

    printTick() {
        print(this.tick)
    }


    @action.bound
    setTicks(ticks) {
        this.ticks = ticks;
    }

    @action.bound
    pushTicks(tick) {
        this.ticks.push(tick);
    }

    @action.bound
    popTicks() {
        this.ticks.pop()
    }

    @computed
    get current_tick() {
        return this.tick;
    }

    @computed
    setTick(tick) {
        this.tick = tick;
    }


    @action.bound
    fetchAssets() {
        return new Promise((resolve, reject) => {
            // TOOD: fetch symbols here later
            const ws = this.openConnection()
            // when websocket is connected after handshake
            ws.onopen = function(e) {
                ws.send(JSON.stringify({
                    active_symbols: "brief",
                    "product_type": "basic"
                }))
            }

            // when message is received
            ws.onmessage = (msg) => {
                let assets = JSON.parse(msg.data).active_symbols
                this.setAssets(assets)
                // close the websocket since we already gotten our data
                ws.close()
                resolve(assets)
            }

            ws.onerror = (err) => {
                reject(err)
            }
        })

    }

    @action.bound
    openConnection() {
        if (!this.connection) {
            let connection = new WebSocket(`wss://frontend.binaryws.com/websockets/v3?app_id=${APP_ID}`)
            connection.onopen = (e) => {
                connection.send(JSON.stringify({
                    "authorize": TOKEN
                }))
            }
            this.setConnection(connection)
            return connection;
        }
        return this.connection;
    }

    // checks if a connection has already been made, if not then initialize a new connection
    @action.bound
    checkConnection() {
        // create a seperate stream for different assets, or else we may get more than one tick for different assets in one stream      
        if (this.connection !== null && this.assets.length > 0) {
            this.unsubscribe()
            this.connection.close()
            this.setConnection(null)
        }
        let connection = this.openConnection()
        this.setConnection(connection)
        this.setApi(new DerivAPI({ connection }))
    }

    @action.bound
    fetchTickHistory(asset) {
        return new Promise((resolve, reject) => {
            // const ws = new WebSocket(`wss://frontend.binaryws.com/websockets/v3?app_id=${APP_ID}`)
            const ws = this.openConnection()
            // when websocket is connected after handshake
            ws.onopen = function(e) {
                ws.send(JSON.stringify({
                    ticks_history: asset,
                    end: "latest",
                    count: 20,
                    style: "ticks"
                }))
            }

            // when message is received
            ws.onmessage = (msg) => {
                console.log(msg)
                let { history } = JSON.parse(msg.data)
                console.log(history)
                let { prices, times } = history;
                let historyTicks = []
                prices.map((price, i) => {
                    historyTicks.push({
                        x: new Date(times[i]),
                        y: price
                    })
                })
                this.setAssets(historyTicks)
                // close the websocket since we already gotten our data
                // ws.close()
                resolve(historyTicks)
            }

            ws.onerror = (err) => {
                reject(err)
            }
        })
    }

    // Using generators with yield to perform asynchronous actions
    *fetchLatestTicks(asset) {
        this.checkConnection()
        const updateTicks = (s) => {
            if (s.raw.symbol === this.current_asset.symbol) {
                let latestTick = {
                    symbol: s.raw.symbol,
                    ask: s.raw.ask,
                    bid: s.raw.bid,
                    quote: s.raw.quote,
                    date: new Date(s.raw.epoch)
                }
                this.setTick(latestTick)
                if (this.ticks.length >= 100) {
                    this.popTicks()
                }
                this.pushTicks(latestTick)
            }
        }
        this.setTickStream(yield this.api.ticks(asset))
        this.subscription = this.tickStream.onUpdate().subscribe(updateTicks)
    }
}


// Provider pattern: hook to act as the store provider
let context;
export function useStore() {
    // singleton pattern
    if (!context) {
        const store = new Store();
        context  = React.createContext(store)
    }
    return React.useContext(context);
}