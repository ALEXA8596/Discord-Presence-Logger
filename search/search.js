const { QueryType, SearchOptions, PlayerSearchResult } = require("./types/types");
const { Track } = require("./Structures/Track");
const { QueryResolver } = require("./utils/QueryResolver");
const YouTube = require("youtube-sr").default;
const { Util } = require("./utils/Util");
const Spotify = require("spotify-url-info");
const { getInfo: ytdlGetInfo } = require("ytdl-core");
const { Playlist } = require("./Structures/Playlist");


/**
 * Search tracks
 * @param {string|Track} query The search query
 * @param {SearchOptions} options The search options
 * @returns {Promise<PlayerSearchResult>}
 */
async function search(query, options = {}) {
    // if (query instanceof Track) return { playlist: query.playlist || null, tracks: [query] };

    if (!("searchEngine" in options)) options.searchEngine = QueryType.AUTO;

    const qt = options.searchEngine === QueryType.AUTO ? QueryResolver.resolve(query) : options.searchEngine;
    switch (qt) {
        case QueryType.YOUTUBE_VIDEO:
            {
                const info = await ytdlGetInfo(query, this.options.ytdlOptions).catch(Util.noop);
                if (!info) return { playlist: null, tracks: [] };

                const track = new Track({
                    title: info.videoDetails.title,
                    description: info.videoDetails.description,
                    author: info.videoDetails.author.name,
                    url: info.videoDetails.video_url,
                    requestedBy: options.requestedBy,
                    thumbnail: Util.last(info.videoDetails.thumbnails).url,
                    views: parseInt(info.videoDetails.viewCount.replace(/[^0-9]/g, "")) || 0,
                    duration: Util.buildTimeCode(Util.parseMS(parseInt(info.videoDetails.lengthSeconds) * 1000)),
                    source: "youtube",
                    raw: info
                });

                return { playlist: null, tracks: [track] };
            }
        case QueryType.YOUTUBE_SEARCH:
            {
                const videos = await YouTube.search(query, {
                    type: "video"
                }).catch(Util.noop);
                if (!videos) return { playlist: null, tracks: [] };

                const tracks = videos.map((m) => {
                    (m).source = "youtube"; // eslint-disable-line @typescript-eslint/no-explicit-any
                    return new Track({
                        title: m.title,
                        description: m.description,
                        author: m.channel.name,
                        url: m.url,
                        requestedBy: options.requestedBy,
                        thumbnail: m.thumbnail.displayThumbnailURL("maxresdefault"),
                        views: m.views,
                        duration: m.durationFormatted,
                        source: "youtube",
                        raw: m
                    });
                });

                return { playlist: null, tracks };
            }
        case QueryType.SOUNDCLOUD_TRACK:
        case QueryType.SOUNDCLOUD_SEARCH:
            {
                const result = QueryResolver.resolve(query) === QueryType.SOUNDCLOUD_TRACK ? [{ url: query }] : await soundcloud.search(query, "track").catch(() => []);
                if (!result || !result.length) return { playlist: null, tracks: [] };
                const res = [];

                for (const r of result) {
                    const trackInfo = await soundcloud.getSongInfo(r.url).catch(Util.noop);
                    if (!trackInfo) continue;

                    const track = new Track({
                        title: trackInfo.title,
                        url: trackInfo.url,
                        duration: Util.buildTimeCode(Util.parseMS(trackInfo.duration)),
                        description: trackInfo.description,
                        thumbnail: trackInfo.thumbnail,
                        views: trackInfo.playCount,
                        author: trackInfo.author.name,
                        requestedBy: options.requestedBy,
                        source: "soundcloud",
                        engine: trackInfo
                    });

                    res.push(track);
                }

                return { playlist: null, tracks: res };
            }
        case QueryType.SPOTIFY_SONG:
            {
                const spotifyData = await Spotify.getData(query).catch(Util.noop);
                if (!spotifyData) return { playlist: null, tracks: [] };
                const spotifyTrack = new Track({
                    title: spotifyData.name,
                    description: spotifyData.description || "",
                    author: spotifyData.artists[0].name || "Unknown Artist",
                    url: spotifyData.external_urls.spotify || query,
                    thumbnail: spotifyData.album.images[0].url || spotifyData.preview_url.length || `https://i.scdn.co/image/${spotifyData.preview_url?.split("?cid=")[1]}` || "https://www.scdn.co/i/_global/twitter_card-default.jpg",
                    duration: Util.buildTimeCode(Util.parseMS(spotifyData.duration_ms)),
                    views: 0,
                    requestedBy: options.requestedBy,
                    source: "spotify"
                });

                return { playlist: null, tracks: [spotifyTrack] };
            }
        case QueryType.SPOTIFY_PLAYLIST:
        case QueryType.SPOTIFY_ALBUM:
            {
                const spotifyPlaylist = await Spotify.getData(query).catch(Util.noop);
                if (!spotifyPlaylist) return { playlist: null, tracks: [] };

                const playlist = new Playlist({
                    title: spotifyPlaylist.name || spotifyPlaylist.title,
                    description: spotifyPlaylist.description || "",
                    thumbnail: spotifyPlaylist.images[0].url || "https://www.scdn.co/i/_global/twitter_card-default.jpg",
                    type: spotifyPlaylist.type,
                    source: "spotify",
                    author: spotifyPlaylist.type !== "playlist" ? {
                        name: spotifyPlaylist.artists[0].name || "Unknown Artist",
                        url: spotifyPlaylist.artists[0].external_urls.spotify || null
                    } : {
                        name: spotifyPlaylist.owner.display_name || spotifyPlaylist.owner.id || "Unknown Artist",
                        url: spotifyPlaylist.owner.external_urls.spotify || null
                    },
                    tracks: [],
                    id: spotifyPlaylist.id,
                    url: spotifyPlaylist.external_urls.spotify || query,
                    rawPlaylist: spotifyPlaylist
                });

                if (spotifyPlaylist.type !== "playlist") {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    playlist.tracks = spotifyPlaylist.tracks.items.map((m) => {
                        const data = new Track({
                            title: m.name || "",
                            description: m.description || "",
                            author: m.artists[0].name || "Unknown Artist",
                            url: m.external_urls.spotify || query,
                            thumbnail: spotifyPlaylist.images[0].url || "https://www.scdn.co/i/_global/twitter_card-default.jpg",
                            duration: Util.buildTimeCode(Util.parseMS(m.duration_ms)),
                            views: 0,
                            requestedBy: options.requestedBy,
                            playlist,
                            source: "spotify"
                        });

                        return data;
                    });
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    playlist.tracks = spotifyPlaylist.tracks.items.map((m) => {
                        const data = new Track({
                            title: m.track.name || "",
                            description: m.track.description || "",
                            author: m.track.artists[0].name || "Unknown Artist",
                            url: m.track.external_urls.spotify || query,
                            thumbnail: m.track.album.images[0].url || "https://www.scdn.co/i/_global/twitter_card-default.jpg",
                            duration: Util.buildTimeCode(Util.parseMS(m.track.duration_ms)),
                            views: 0,
                            requestedBy: options.requestedBy,
                            playlist,
                            source: "spotify"
                        });

                        return data;
                    });
                }

                return { playlist: playlist, tracks: playlist.tracks };
            }
        case QueryType.SOUNDCLOUD_PLAYLIST:
            {
                const data = await soundcloud.getPlaylist(query).catch(Util.noop);
                if (!data) return { playlist: null, tracks: [] };

                const res = new Playlist({
                    title: data.title,
                    description: data.description || "",
                    thumbnail: data.thumbnail || "https://soundcloud.com/pwa-icon-192.png",
                    type: "playlist",
                    source: "soundcloud",
                    author: {
                        name: data.author.name || data.author.username || "Unknown Artist",
                        url: data.author.profile
                    },
                    tracks: [],
                    id: `${data.id}`, // stringified
                    url: data.url,
                    rawPlaylist: data
                });

                for (const song of data.tracks) {
                    const track = new Track({
                        title: song.title,
                        description: song.description || "",
                        author: song.author.username || song.author.name || "Unknown Artist",
                        url: song.url,
                        thumbnail: song.thumbnail,
                        duration: Util.buildTimeCode(Util.parseMS(song.duration)),
                        views: song.playCount || 0,
                        requestedBy: options.requestedBy,
                        playlist: res,
                        source: "soundcloud",
                        engine: song
                    });
                    res.tracks.push(track);
                }

                return { playlist: res, tracks: res.tracks };
            }
        case QueryType.YOUTUBE_PLAYLIST:
            {
                const ytpl = await YouTube.getPlaylist(query).catch(Util.noop);
                if (!ytpl) return { playlist: null, tracks: [] };

                await ytpl.fetch().catch(Util.noop);

                const playlist = new Playlist({
                    title: ytpl.title,
                    thumbnail: ytpl.thumbnail,
                    description: "",
                    type: "playlist",
                    source: "youtube",
                    author: {
                        name: ytpl.channel.name,
                        url: ytpl.channel.url
                    },
                    tracks: [],
                    id: ytpl.id,
                    url: ytpl.url,
                    rawPlaylist: ytpl
                });

                playlist.tracks = ytpl.videos.map(
                    (video) =>
                    new Track({
                        title: video.title,
                        description: video.description,
                        author: video.channel.name,
                        url: video.url,
                        requestedBy: options.requestedBy,
                        thumbnail: video.thumbnail.url,
                        views: video.views,
                        duration: video.durationFormatted,
                        raw: video,
                        playlist: playlist,
                        source: "youtube"
                    })
                );

                return { playlist: playlist, tracks: playlist.tracks };
            }
        default:
            return { playlist: null, tracks: [] };
    }
}

// If the file is run directly, run the function
if (require.main === module) {
    const query = process.argv[2];
    search(query).then((res) => {
        // console.log(res);
    });
}

module.exports = {
    search
}