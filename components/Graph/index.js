import { useEffect, useState } from "react"
import { observer } from "mobx-react"
import { useStore } from "@/store"
import { Chart } from "react-chartjs-2"
import "./styles.module.scss"


const Graph = () => {
    const store = useStore()
    const [isFetching, setIsFetching] = useState(false)

    useEffect(() => {
        setIsFetching(true)
        const fetchingLatestTicks = async () => {
            await store.fetchLatestTicks()
        }
        fetchingLatestTicks().then(() => {
            setIsFetching(false)
        })
    }, [])

    const options = {
        responsive: true,
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'second'
                }
            }
        }
    }


    // const data = {
    //     label: "Ask",
    //     data: {
    //         datasets: store.ticks.map(tick => {
    //             return {
    //                 x: tick.date.toString(),
    //                 y: tick.ask
    //             }
    //         })
    //     }
    // }

    return (
        <div className="graph">
            {isFetching && <h1>Loading...</h1>}
            {!isFetching && <h1><b>Ask: {store.tick.ask}</b></h1>}
            {!isFetching && <h1><b>Bid: {store.tick.bid}</b></h1>}

            {/* {!isFetching && <Chart type="line" options={options} data={data} />} */}
        </div>
    )
}

// observer() allows the component to be automatically re-rendered whenever an observable is updated
export default observer(Graph)