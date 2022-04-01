import { useEffect, useState, useRef } from "react"
import { observer } from "mobx-react"
import { useStore } from "@/store"
import { Chart } from "react-chartjs-2"
import 'chart.js/auto'
import 'chartjs-adapter-moment';
import styles from "./Graph.module.scss"
import { reaction, when } from "mobx"
import logo from "../../public/logo.svg"
import Image from "next/image"


const Graph = () => {
    const store = useStore()
    const [isFetching, setIsFetching] = useState(false)
    const [dataset, setDataset] = useState([])

    const chartRef = useRef(null)

    const fetchingLatestTicks = async (symbol) => {
        const historyTicks = await store.fetchTickHistory(symbol)
        await store.fetchLatestTicks(symbol)
        return historyTicks
    }


    useEffect(() => {
        setIsFetching(true)
        const connectionDisposer = when(() => store.api !== null, () => {
            fetchingLatestTicks(store.asset.symbol).then((historyTicks) => {
                console.log('fetched!')
                let { date, quote } = store.tick
                console.log(dataset, historyTicks)
                setDataset([...historyTicks, {
                    x: date,
                    y: quote
                }])
                setIsFetching(false)
            })
        })
        return () => {
            connectionDisposer()
        }
    }, [])


    useEffect(() => {
        const tickDisposer = reaction(() => store.tick, (tick) => {
            const datasets = chartRef.current.data.datasets
            // set threshold (note that max_history_count won't be observed)
            if (datasets[0].data.length >= store.max_history_count) {
                console.log('data is out')
                datasets[0].data.shift()
            }
            // using chartJS's ref wont trigger re-render
            datasets[0].data.push({
                x: tick.date,
                y: tick.quote
            })
            chartRef.current.update()
        })
        
        // TODO: Re-render the graph and fetch the new ticks when user changes asset, will not trigger reaction if user selects the same asset!
        const assetDisposer = reaction(() => store.asset, (asset) => {
            console.log("[Graph] Asset changed!")
            setIsFetching(true)
            fetchingLatestTicks(asset.symbol).then((ticksHistory) => {
                console.log('[Graph] Successfully fetched new asset!')
                setDataset([...ticksHistory, {
                    x: store.tick.date,
                    y: store.tick.quote
                }])
                setIsFetching(false)
            })
        })
        // NOTE: dispose reactions to prevent memory leaks
        return () => {
            tickDisposer()
            assetDisposer()
        }
    })

    const options = {
        responsive: true,
        layout: {
            padding: 20
        },
        scales: {
            x: {
                type: 'time',
                title: {
                    display: true,
                    text: "Time (seconds)"
                },
                time: {
                    unit: 'second'
                },
                grid: {
                    borderColor: '#000000',
                },
            },
            y: {
                title: {
                    display: true,
                    text: "Price ($)"
                },
                grid: {
                    borderColor: '#000000',
                }
            },
        }
    }

    // plugin to change chart background and styles
    const plugin = {
        id: 'canvas_bg',
        beforeDraw: (chart) => {
            const ctx = chart.canvas.getContext('2d');
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = '#F3F3F3'
            ctx.fillRect(0, 0, chart.canvas.width, chart.height)
            ctx.restore()
        }
    }

    return (
        <div className={styles.graph}>
            {isFetching && <div><Image src={logo} alt="Loading..." className={styles.graph__text} width={150} height={25}/></div>}
            {!isFetching && 
                <Chart 
                    ref={chartRef} 
                    type="line" 
                    options={options} 
                    plugins={[plugin]}
                    data={{
                        datasets: [{
                            id: 1,
                            label: 'Quote Price',
                            data: dataset,
                            borderColor:  'rgb(168, 195, 159)',
                            pointRadius: 2,
                        }
                        ]}
                    }
                />} 
        </div>
    )
}

// observer() allows the component to be automatically re-rendered whenever an observable is updated
export default observer(Graph)