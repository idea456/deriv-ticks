import Head from 'next/head'
import Graph from "@/components/Graph"
import Dropdown from "@/components/Dropdown"
import { useStore } from "@/store"
import { observer } from 'mobx-react'

function Home() {
  const store = useStore()

  return (
    <div className="main">
      <Head>
        <title>Deriv Ticks</title>
        <meta name="description" content="Deriv ticks" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="main__content">
        <h1>{store.current_asset}</h1>
        <Graph />
        {/* Rendering dropdown collections in dedicated components for optimization, see https://mobx.js.org/react-optimizations.html */}
        <Dropdown />
      </div>
    </div>
  )
}

export default observer(Home)