import { instantMeiliSearch } from "@meilisearch/instant-meilisearch";
import { mauve } from "@radix-ui/colors";
import * as Tooltip from "@radix-ui/react-tooltip";
import { styled } from "@stitches/react";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import { BsFillPlayBtnFill } from "react-icons/bs";
import {
  Configure,
  InstantSearch,
  RefinementList,
  SearchBox,
  useHits,
  UseHitsProps,
} from "react-instantsearch-hooks-web";
import YouTube from "react-youtube";
import styles from "../styles/Home.module.css";

interface SpeechFragment {
  word: string;
  freq: number;
  meaning?: string;
}

interface Speech {
  id: string;
  fragments: SpeechFragment[];
  start: number;
  end: number;
  video: string;
  channel: string;
}

type Hit = Speech & {
  _highlightResult: { [id in keyof Speech]: { value: Speech[id] } };
  _snippetResult: { [id in keyof Speech]: { value: Speech[id] } };
  __position: number;
};

const searchClient = instantMeiliSearch(
  process.env.NEXT_PUBLIC_MEILI_URL!,
  process.env.NEXT_PUBLIC_MEILI_SEARCH_KEY!
);

const CHANNEL_AVATAR: Record<string, string> = {
  kaela:
    "https://yt3.ggpht.com/PxkGgLvMEUgmme35T0VPLR8d5brJw4YTzJC5PE48mkYRdy-mq8FsKv_Sy-bJmxqvlgtitqMWtg=s176-c-k-c0x00ffffff-no-rj",
  zeta: "https://yt3.ggpht.com/-IdVo-vK7pr0VRjJDdza1-t1Edjce1Rd1R1hon_3SRIzuQ-XVBTWOJj-UfwYPp8y40KM197_y4o=s176-c-k-c0x00ffffff-no-rj",
  kobo: "https://yt3.ggpht.com/Zi6DMbqTrk8jpNKnJgbw_NxGnggsKX1omQnPeHxrZTmrVmon7zfmg5Q4XbqsHO9AMidW49zCPw=s176-c-k-c0x00ffffff-no-rj",
};

const Flex = styled("div", { display: "flex" });

const StyledContent = styled(Tooltip.Content, {
  borderRadius: 4,
  padding: "10px 15px",
  fontSize: 15,
  lineHeight: 1,
  backgroundColor: "white",
  boxShadow:
    "hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px",
  "@media (prefers-reduced-motion: no-preference)": {
    animationDuration: "400ms",
    animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
    animationFillMode: "forwards",
    willChange: "transform, opacity",
  },
});

const VideoContainer = styled("div", {
  height: "200px",
  width: "100%",
});

const VideoPlaceholder = styled("div", {
  height: "100%",
  width: "100%",
  cursor: "pointer",
  userSelect: "none",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#e34b4b",
  color: "white",
});

function Video(props: { video: string; start: number; end: number }) {
  const [visibility, setVisibility] = useState<boolean>(false);

  return (
    <VideoContainer>
      {visibility ? (
        <YouTube
          videoId={props.video}
          opts={{
            height: "200",
            width: "100%",
            playerVars: {
              // https://developers.google.com/youtube/player_parameters
              modestbranding: 1,
              rel: 0,
              autoplay: 1,
              start: props.start,
              end: props.end,
            },
          }}
          loading="lazy"
          onEnd={(e) => {
            // https://developers.google.com/youtube/iframe_api_reference
            const player = e.target;
            player.seekTo(props.start);
            player.pauseVideo();
          }}
        />
      ) : (
        <VideoPlaceholder onClick={() => setVisibility(true)}>
          <BsFillPlayBtnFill size={70} />
        </VideoPlaceholder>
      )}
    </VideoContainer>
  );
}

const StyledArrow = styled(Tooltip.Arrow, {
  fill: "white",
});

const WordWithInfo = styled("span", {
  color: "#e34b4b",
});

const Text = styled("div", {
  margin: 0,
  color: mauve.mauve12,
  fontSize: 15,
  lineHeight: 1.5,
  variants: {
    faded: {
      true: { color: mauve.mauve10 },
    },
    bold: {
      true: { fontWeight: 500 },
    },
  },
});

function Speech({
  fragments,
  speaker,
}: {
  fragments: SpeechFragment[];
  speaker: string;
}) {
  return (
    <Tooltip.Provider>
      <h2>
        <Image
          src={CHANNEL_AVATAR[speaker]!}
          alt={speaker}
          width={20}
          height={20}
        />{" "}
        {fragments.map((frag, i) => (
          <span key={frag.word + i}>
            {frag.meaning ? (
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger asChild>
                  <WordWithInfo>{frag.word} </WordWithInfo>
                </Tooltip.Trigger>
                <StyledContent>
                  <Flex css={{ gap: 5 }}>
                    <Text bold>{frag.meaning ?? ""}</Text>
                  </Flex>

                  <Flex css={{ gap: 5 }}>
                    <Text faded>Frequency</Text>
                    <Text>{frag.freq}</Text>
                  </Flex>
                  <StyledArrow />
                </StyledContent>
              </Tooltip.Root>
            ) : (
              <span>{frag.word} </span>
            )}
          </span>
        ))}
      </h2>
    </Tooltip.Provider>
  );
}

function CustomHits(props: UseHitsProps) {
  // @ts-ignore
  const { hits } = useHits<Hit>(props);

  return (
    <div className={styles.hits}>
      {hits.map((hit) => (
        <div key={hit.id} className={styles.hit}>
          <Video video={hit.video} start={hit.start} end={hit.end} />
          <Speech fragments={hit.fragments} speaker={hit.channel} />
        </div>
      ))}
    </div>
  );
}

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
      </Head>

      <main className={styles.main}>
        <InstantSearch
          indexName="speeches"
          searchClient={searchClient}
          stalledSearchDelay={5000}
        >
          <Configure hitsPerPage={9} />
          <div className={styles.search}>
            <h1>Learn Bahasa Indonesia with Hololive ID</h1>
            <SearchBox placeholder='e.g. "sunyi dan sepi" "dimas berguna" "bukan kucing"' />
            <RefinementList attribute="channel" />
            <div style={{ marginTop: 20 }}>
              <Text faded>
                See how HoloID VTubers use certain phrase or word.
              </Text>
              <Text faded>
                We are also working on a support for HoloID Gen1 and Gen2, as
                well as ID-EN dictionary and Duolingo thingy (Hololingo™️)
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
