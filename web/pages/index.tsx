import { instantMeiliSearch } from "@meilisearch/instant-meilisearch";
import type { NextPage } from "next";
import Head from "next/head";
import {
  Configure,
  InstantSearch,
  RefinementList,
  SearchBox,
} from "react-instantsearch-hooks-web";
import { CustomHits } from "../components/Hits";
import { Text } from "../components/Text";
import styles from "../styles/Home.module.css";

export interface SpeechFragment {
  word: string;
  freq: number;
  meaning?: string;
}

export interface Speech {
  id: string;
  fragments: SpeechFragment[];
  start: number;
  end: number;
  video: string;
  channel: string;
}

const searchClient = instantMeiliSearch(
  process.env.NEXT_PUBLIC_MEILI_URL!,
  process.env.NEXT_PUBLIC_MEILI_SEARCH_KEY!
);

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Do HoloID Say It</title>
        <meta
          name="description"
          content="See how HoloID VTubers use certain phrase or word."
        />
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/instantsearch.css@7.3.1/themes/reset-min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@meilisearch/instant-meilisearch/templates/basic_search.css"
        />
        <script
          async
          defer
          data-website-id="0672fb3a-64b3-42c4-aa83-d23c450e9ac5"
          src="https://analytics.uechi.io/umami.js"
        ></script>
      </Head>

      <main className={styles.main}>
        <InstantSearch
          indexName="speeches"
          searchClient={searchClient}
          stalledSearchDelay={5000}
        >
          <Configure hitsPerPage={9} />
          <div className={styles.search}>
            <h1>Do HoloID Say It</h1>
            <SearchBox placeholder='e.g. "sunyi dan sepi" "dimas berguna" "bukan kucing"' />
            <RefinementList attribute="channel" />
            <div style={{ marginTop: 20 }}>
              <Text faded>
                See how HoloID members say certain phrase or word.
              </Text>
              <Text faded>
                We are working on a support for HoloID Gen1 and Gen2, as well as
                ID-EN dictionary and Duolingo thingy (Hololingo™️)
              </Text>
              <Text faded>
                <a href="https://holodata.org">[⚡️ Website]</a>
                <a href="https://github.com/holodata">[🦄 GitHub]</a>
                <a href="https://holodata.org/discord">[🎙 Discord]</a>
              </Text>
              <Text faded>
                Thanks to{" "}
                <a href="https://dopeoplesay.com/">[Do people say it]</a> for
                giving me inspiration.
              </Text>
            </div>
          </div>
          <CustomHits />
        </InstantSearch>
      </main>
    </div>
  );
};

export default Home;
