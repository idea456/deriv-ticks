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
    const [isFetching, setIsFetching] = useState(true)
    const [dataset, setDataset] = useState([])

    const chartRef = useRef(null)

    const fetchLatestTicks = (symbol) => {
        setIsFetching(true)
        // will not return anything but establish a subscriber
        // subscriber will continiously update store.tick
        store.requestTickHistory(symbol);
    }


    useEffect(() => {
        // once connection is established, begin by requesting for the ticks history first
        const connectionDisposer = when(() => store.connection !== null, () => {
            fetchLatestTicks(store.asset.symbol)
        })

        const ticksDisposer = when(() => store.all_ticks.length > 0 && store.assets.length > 0, async () => {
            await store.subscribeToTicks(store.asset.symbol)
            setIsFetching(false)
        })

        reaction(() => store.asset, async (asset) => {
            setIsFetching(true)
            store.requestTickHistory(asset.symbol)
            store.subscribeToTicks(asset.symbol).then(() => {
                setIsFetching(false)
            })
        })

        reaction(() => store.all_ticks, (history) => {
            setDataset(history)
        })

        return () => {
            connectionDisposer()
            ticksDisposer()
        }
    }, [])


    useEffect(() => {
        const tickDisposer = reaction(() => store.current_tick, (tick) => {
            console.log('[Graph] Updating...')
            const datasets = chartRef.current.data.datasets
            let offset = 1
            // set threshold (note that max_history_count won't be observed)
            if (datasets[0].data.length >= store.max_history_count + offset) {
                datasets[0].data.shift()
            }
            setDataset([...dataset, {
                x: tick.date,
                y: tick.quote
            }])
            datasets[0].data.push({
                x: tick.date,
                y: tick.quote
            })
            chartRef.current.update()
        })
    
        // NOTE: dispose reactions to prevent memory leaks
        return () => {
            tickDisposer()
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
                            borderColor:  'rgb(230, 62, 109)',
                            pointRadius: 0,
                        }
                        ]}
                    }
                />} 
        </div>
    )
}

// observer() allows the component to be automatically re-rendered whenever an observable is updated
export default observer(Graph)