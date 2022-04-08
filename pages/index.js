import {useEffect} from "react"
import Head from 'next/head'
import Graph from "@/components/Graph"
import Dropdown from "@/components/Dropdown"
import { useStore } from "@/store"
import { observer } from 'mobx-react'

function Home() {
  const store = useStore()

  useEffect(() => {
    // initialize connection to DerivAPI and attach stream handlers
    if (!store.connection) {
      store.handleMessages()
    }
  }, [])

  return (
    <div className="main">
      <Head>
        <title>Deriv Ticks</title>
        <meta name="description" content="Deriv ticks" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="main__content">
        <h1>{store.asset.name}</h1>
        <Graph />
        {/* Rendering dropdown collections in dedicated components for optimization, see https://mobx.js.org/react-optimizations.html */}
        <Dropdown />
      </div>
    </div>
  )
}

export default observer(Home)