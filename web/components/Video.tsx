import { styled } from "@stitches/react";
import React, { useState } from "react";
import { BsFillPlayBtnFill } from "react-icons/bs";
import YouTube from "react-youtube";

export function Video(props: { video: string; start: number; end: number }) {
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
  background: "#e2e2e2",
  color: "white",
});
