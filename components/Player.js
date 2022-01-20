import {
  HeartIcon,
  VolumeUpIcon as VolumeDownIcon,
} from "@heroicons/react/outline";
import {
  RewindIcon,
  SwitchHorizontalIcon,
  FastForwardIcon,
  PauseIcon,
  PlayIcon,
  ReplyIcon,
  VolumeUpIcon,
} from "@heroicons/react/outline";
import { debounce } from "lodash";
import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { currentTrackIdState, isPlayingState } from "../atoms/songAtom";
import useSongInfo from "../hooks/useSongInfo";
import useSpotify from "../hooks/useSpotify";
import millisToMinuteAndSeconds from "../lib/time";

function Player() {
  const spotifyApi = useSpotify();
  const { data: session, status } = useSession();
  const [currentTrackId, setCurrentTrackId] =
    useRecoilState(currentTrackIdState);
  const [isPlaying, setIsPlaying] = useRecoilState(isPlayingState);
  const [volume, setVolume] = useState(50);
  const [playtime, setPlaytime] = useState(0);
  const [atTime, setAtTime] = useState(0);
  const songInfo = useSongInfo();

  const fetchCurrentSong = async () => {
    if (!songInfo) {
      await spotifyApi.getMyCurrentPlayingTrack().then((data) => {
        setCurrentTrackId(data.body?.item?.id);
        spotifyApi.getMyCurrentPlaybackState().then((data) => {
          setIsPlaying(data.body?.is_playing);
        });
      });
    }
  };

  const handlePlayPause = () => {
    spotifyApi.getMyCurrentPlaybackState().then((data) => {
      if (data.body.is_playing) {
        spotifyApi.pause();
        setIsPlaying(false);
      } else {
        spotifyApi.play();
        setIsPlaying(true);
      }
    });
  };

  useEffect(() => {
    if (spotifyApi.getAccessToken() && !currentTrackId) {
      fetchCurrentSong();
      setVolume(50);
    }
  }, [currentTrackId, spotifyApi, session]);

  useEffect(() => {
    if (volume > 0 && volume < 100) {
      if (spotifyApi.getAccessToken) {
        debouncedAdjustVolume(volume);
      }
    }
  }, [volume]);

  useEffect(() => {
    debounceAdjustplaytime(playtime);
  }, [playtime]);

  const debouncedAdjustVolume = useCallback(
    debounce((volume) => {
      spotifyApi.setVolume(volume).catch((err) => {});
    }, 300),
    []
  );

  const debounceAdjustplaytime = useCallback(
    debounce((playtime) => {
      spotifyApi.seek(playtime).catch((err) => {});
    }, 300),
    []
  );

  return (
    <div
      className="h-24 bg-gradient-to-b from-black to-gray-900 
    text-white grid grid-cols-8  text-xs md:text-base px-2 md:px-8"
    >
      {/* Left */}
      <div className="flex col-span-2 items-center space-x-4">
        <img
          className="hidden md:inline h-10 w-10"
          src={songInfo?.album.images?.[0]?.url}
          alt=""
        />
        <div>
          <h3>{songInfo?.name}</h3>
          <p>{songInfo?.artists?.[0]?.name}</p>
        </div>
      </div>
      <div className="col-span-4">
        {/* Center */}
        <div className="flex items-center justify-center">
          <SwitchHorizontalIcon className="button" />
          <RewindIcon className="button" />
          {isPlaying ? (
            <PauseIcon onClick={handlePlayPause} className="button w-10 h-10" />
          ) : (
            <PlayIcon onClick={handlePlayPause} className="button w-10 h-10" />
          )}
          {/* Fastforward is broken on spotifyAPI */}
          <FastForwardIcon className="button" />
          <ReplyIcon className="button" />
        </div>
        <div className="flex items-center justify-between pt-4 space-x-4">
          <p className="text-white p-2">0:00</p>
          <input
            className="w-screen"
            value={playtime}
            type="range"
            min={0}
            max={songInfo?.duration_ms}
            onChange={(e) => setPlaytime(Number(e.target.value))}
          />
          <p className="text-white p-2">
            {millisToMinuteAndSeconds(songInfo?.duration_ms)}
          </p>
        </div>
      </div>
      <div className="flex col-span-2 items-center space-x-3 md:space-x-4 justify-end pr-5">
        {/* Right */}
        <VolumeDownIcon
          onClick={() => volume > 0 && setVolume(volume - 10)}
          className="button"
        />
        <input
          className="w-14 md:w-28"
          type="range"
          value={volume}
          min={0}
          max={100}
          onChange={(e) => setVolume(Number(e.target.value))}
        />
        <VolumeUpIcon
          onClick={() => volume < 100 && setVolume(volume + 10)}
          className="button"
        />
      </div>
    </div>
  );
}

export default Player;
