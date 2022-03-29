import Head from 'next/head'
import Graph from "@/components/Graph"

export default function Home() {
  return (
    <div>
      <Head>
        <title>Deriv Ticks</title>
        <meta name="description" content="Deriv ticks" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div>
        <Graph />
      </div>
    </div>
  )
}
