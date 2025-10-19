import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles.css';

export default function BlazeApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Developer Utilities | BlazeSportsIntel</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
