import { Cross2Icon } from "@radix-ui/react-icons";
import { styled } from "@stitches/react";
import Image from "next/image";
import { SpeechFragment } from "../pages/index";
import {
  Popover,
  PopoverArrow,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "./Popover";
import { Text } from "./Text";

const CHANNEL_AVATAR: Record<string, string> = {
  kaela:
    "https://yt3.ggpht.com/PxkGgLvMEUgmme35T0VPLR8d5brJw4YTzJC5PE48mkYRdy-mq8FsKv_Sy-bJmxqvlgtitqMWtg=s176-c-k-c0x00ffffff-no-rj",
  zeta: "https://yt3.ggpht.com/-IdVo-vK7pr0VRjJDdza1-t1Edjce1Rd1R1hon_3SRIzuQ-XVBTWOJj-UfwYPp8y40KM197_y4o=s176-c-k-c0x00ffffff-no-rj",
  kobo: "https://yt3.ggpht.com/Zi6DMbqTrk8jpNKnJgbw_NxGnggsKX1omQnPeHxrZTmrVmon7zfmg5Q4XbqsHO9AMidW49zCPw=s176-c-k-c0x00ffffff-no-rj",
};

export function SpeechBubble({
  fragments,
  speaker,
}: {
  fragments: SpeechFragment[];
  speaker: string;
}) {
  return (
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
            <Popover>
              <PopoverTrigger asChild>
                <WordWithInfo>{frag.word} </WordWithInfo>
              </PopoverTrigger>
              <PopoverContent>
                <Flex css={{ gap: 5 }}>
                  <Text bold>{frag.meaning ?? ""}</Text>
                </Flex>

                <Flex css={{ gap: 5 }}>
                  <Text faded>Frequency</Text>
                  <Text>{frag.freq}</Text>
                </Flex>
                <PopoverArrow />
                <PopoverClose aria-label="Close">
                  <Cross2Icon />
                </PopoverClose>
              </PopoverContent>
            </Popover>
          ) : (
            <span>{frag.word} </span>
          )}
        </span>
      ))}
    </h2>
  );
}

const Flex = styled("div", { display: "flex" });

const WordWithInfo = styled("span", {
  color: "#e34b4b",
  cursor: "pointer",
});
