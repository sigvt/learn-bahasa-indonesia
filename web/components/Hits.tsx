import React from "react";
import { UseHitsProps, useInfiniteHits } from "react-instantsearch-hooks-web";
import styles from "../styles/Home.module.css";
import { SpeechBubble } from "./Speech";
import { Video } from "./Video";
import { useInteraction } from "../hooks/useInteraction";
import { Speech } from "../pages";
import { styled } from "@stitches/react";

export type Hit = Speech & {
  _highlightResult: { [id in keyof Speech]: { value: Speech[id] } };
  _snippetResult: { [id in keyof Speech]: { value: Speech[id] } };
  __position: number;
};

export function CustomHits(props: UseHitsProps) {
  // @ts-ignore
  const { hits, isLastPage, showMore } = useInfiniteHits<Hit>(props);
  const [ref] = useInteraction<HTMLDivElement>(() => {
    showMore();
  }, [showMore]);

  return (
    <div className={styles.hits}>
      {hits.map((hit) => (
        <div key={hit.id} className={styles.hit}>
          <Video video={hit.video} start={hit.start} end={hit.end} />
          <SpeechBubble fragments={hit.fragments} speaker={hit.channel} />
        </div>
      ))}
      {!isLastPage && <Sentinel ref={ref}>Load more</Sentinel>}
    </div>
  );
}

export const Sentinel = styled("div", {
  visibility: "hidden",
});
