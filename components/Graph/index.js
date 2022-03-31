import { useEffect, useState, useRef } from "react"
import { observer } from "mobx-react"
import { useStore } from "@/store"
import { Chart } from "react-chartjs-2"
import 'chart.js/auto'
import 'chartjs-adapter-moment';
import styles from "./Graph.module.scss"
import { reaction, when } from "mobx"


const Graph = () => {
    const store = useStore()
    const [isFetching, setIsFetching] = useState(false)
    const [dataset, setDataset] = useState([])
    const [redraw, setRedraw] = useState(false)

    const chartRef = useRef(null)

    const fetchingLatestTicks = async (symbol) => {
        await store.fetchLatestTicks(symbol)
    }


    useEffect(() => {
        setIsFetching(true)
        fetchingLatestTicks("R_100").then(() => {
            setIsFetching(false)
        })
    }, [])


    useEffect(() => {
        const tickDisposer = reaction(() => store.tick, (tick) => {
            setDataset([...dataset, {
                x: tick.date,
                y: tick.ask
            }])
        })
        
        // TODO: Re-render the graph and fetch the new ticks when user changes asset, will not trigger reaction if user selects the same asset!
        const connectionDisposer = reaction(() => store.asset, (asset) => {
            console.log("[Graph] Asset changed!")
            setIsFetching(true)
            fetchingLatestTicks(asset).then(() => {
                console.log('[Graph] Successfully fetched new asset!')
                setIsFetching(false)
                setDataset([{
                    x: store.tick.date,
                    y: store.tick.ask
                }])
                setRedraw(true)
            })
        })
        // NOTE: dispose reactions to prevent memory leaks
        return () => {
            tickDisposer()
            connectionDisposer()
            if (redraw) {
                setRedraw(false)
            }
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
            {isFetching && <h1 className={styles.graph__text}>Loading...</h1>}
            {!isFetching && dataset.length > 0 && 
                <Chart 
                    ref={chartRef} 
                    type="line" 
                    options={options} 
                    plugins={[plugin]} 
                    data={{
                        datasets: [{
                            label: 'Ask Price',
                            data: dataset,
                            borderColor:  'rgb(168, 195, 159)',
                            pointRadius: 2,
                        }]}
                    } 
                    redraw={redraw}
                />} 
        </div>
    )
}

// observer() allows the component to be automatically re-rendered whenever an observable is updated
export default observer(Graph)