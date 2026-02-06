# ⚡Anime-API⚡
<p align="center">
  <img src="https://skillicons.dev/icons?i=ts,express,nodejs,docker,html,css,js" />
  <br/>
  <a href="https://api-anime-rouge.vercel.app"><kbd>api-anime-rouge.vercel.app</kbd></a>
</p>
<br/><br/>

Check it out at <a href="https://api-anime-rouge.vercel.app"><kbd>api-anime-rouge.vercel.app</kbd></a>.

## 🎬 Frontend - Watch Anime

A frontend web application is available on GitHub Pages that allows you to watch anime using this API.

**🌐 Live Demo:** [Watch Anime on GitHub Pages](https://cloudcompile.github.io/aninescraoer/)

### Features
- 🏠 **Home Page** - Spotlight, trending, and latest anime
- 🔍 **Search** - Find anime by name
- 📺 **Watch Episodes** - Stream anime episodes with multiple server options
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🌙 **Dark Theme** - Easy on the eyes

### Frontend Setup

The frontend is located in the `/docs` folder and is automatically deployed to GitHub Pages via GitHub Actions.

To enable GitHub Pages:
1. Go to your repository settings
2. Navigate to "Pages" 
3. Under "Build and deployment", select "GitHub Actions"
4. The workflow will automatically deploy on push to `main` branch

<break>

>[!IMPORTANT]
>Local Caching is implemented

| Routes                                                   | Caching Duration      |
|---------------------------------------------------------|-----------------------|
| `/imdb/search?query=${query}&type=${type}&limit=${limit}` | 1 hour (3600)         |
| `/aniwatch/`                                            | 1 day (3600 * 24)     |
| `/aniwatch/az-list?page=${page}`                        | 1 day (3600 * 24)     |
| `/aniwatch/search?keyword=$(query)&page=${page}`         | 1 hour (3600)         |
| `/aniwatch/anime/:id`                                   | 1 month (3600 * 24 * 31) |
| `/aniwatch/episodes/:id`                                | 1 day (3600 * 24)     |
| `/aniwatch/servers?id=${id}`                             | 1 day (3600 * 24)    |
| `/aniwatch/episode-srcs?id=${episodeId}&server=${server}&category=${category}` | 30 minutes (1800)     |
| `/aniwatch/episode-srcs-fallback?id=${episodeId}&category=${category}` | 30 minutes (1800)     |
| `/aniwatch/:category?page=${page}`                      | 1 day (3600 * 24)     |
| `/gogoanime/home`                                       | 1 day (3600 * 24)     |
| `/gogoanime/search?keyword=${query}&page=${page}`        | 1 hour (3600)         |
| `/gogoanime/anime/:id`                                  | 1 day (3600 * 24)     |
| `/gogoanime/recent-releases?page=${pageNo}`              | 1 day (3600 * 24)    |
| `/gogoanime/new-seasons?page=${pageNo}`                  | 1 day (3600 * 24)     |
| `/gogoanime/popular?page=${pageNo}`                      | 1 day (3600 * 24)     |
| `/gogoanime/completed?page=${pageNo}`                    | 1 day (3600 * 24)     |
| `/gogoanime/anime-movies?page=${pageNo}`                 | 1 day (3600 * 24)     |
| `/gogoanime/top-airing?page=${pageNo}`                   | 1 day (3600 * 24)     |


### Deploy this project to Vercel

Click the button below to deploy this project to your Vercel account:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/falcon71181/Anime-API)


## ⚡ Web Scraping Status

Anime Websites  |    STATUS
--------------  | -------------
aniwatch        | <b>DONE</b>
gogoanime       | <b>WORKING ON IT</b>
kickassanime    | <b>IN FUTURE</b>

>[!NOTE]
>More Websites Will be Added in Future

## Index

- [AniWatch](#aniwatch)
- [GogoAnime](#gogoanime)

##  <span id="aniwatch">AniWatch</span>

### `GET` AniWatch Home Page

#### Endpoint

```url
https://api-anime-rouge.vercel.app/aniwatch/
```

#### Request sample

```javascript
const res = await fetch("https://api-anime-rouge.vercel.app/aniwatch/");
const data = await res.json();
console.log(data);
```

#### Response Schema

```typescript
{
  spotlightAnimes: [
    {
      id: string,
      name: string,
      rank: number,
      img: string,
      episodes: {
        eps: number,
        sub: number,
        dub: number,
      },
      duration: string,
      quality: string,
      category: string,
      releasedDay: string,
      descriptions: string,
    },
    {...},
  ],
  trendingAnimes: [
    {
      id: string,
      name: string,
      img: string,
    },
    {...},
  ],
  latestEpisodes: [
    {
      id: string,
      name: string,
      img: string,
      episodes: {
        eps: number,
        sub: number,
        dub: number,
      },
      duration: string,
      rated: boolean,
    },
    {...},
  ],
  top10Animes: {
    day: [
      {
        id: string,
        name: string,
        rank: number,
        img: string,
        episodes: {
          eps: number,
          sub: number,
          dub: number,
        },
      },
      {...},
    ],
    week: [...],
    month: [...]
  },
  featuredAnimes: {
    topAiringAnimes: [
        {
            id: string,
            name: string,
            img: string,
        },
        {...},
    ],
    mostPopularAnimes: [
        {
            id: string,
            name: string,
            img: string,
        },
        {...},
    ],
    mostFavoriteAnimes: [
        {
            id: string,
            name: string,
            img: string,
        },
        {...},
    ],
    latestCompletedAnimes: [
        {
            id: string,
            name: string,
            img: string,
        },
        {...},
    ],
  },
  topUpcomingAnimes: [
    {
      id: string,
      name: string,
      img: string,
      episodes: {
        eps: number,
        sub: number,
        dub: number,
      },
      duration: string,
      rated: boolean,
    },
    {...},
  ],
  genres: string[]
}
```

### `GET` AniWatch A to Z List Page

#### Endpoint

```url
https://api-anime-rouge.vercel.app/aniwatch/az-list?page=${page}
```

#### Query Parameters

| Parameter |  Type  |             Description              | Required? | Default |
| :-------: | :----: | :----------------------------------: | :-------: | :-----: |
|  `page`   | number |        Page No. of Search Page       |    YES    |    1    |


#### Request sample

```typescript
const resp = await fetch("https://api-anime-rouge.vercel.app/aniwatch/az-list?page=69");
const data = await resp.json();
console.log(data);
```

#### Response Schema

```typescript
[
        {
            "id": string,
            "name": string,
            "category": string,
            "img": string,
            "episodes": {
                "eps": number,
                "sub": number,
                "dub": number
            }
        },
        {...},
],
```

### `GET` Anime About Info

#### Endpoint

```sh
https://api-anime-rouge.vercel.app/aniwatch/anime/:id
```

#### Query Parameters

| Parameter |  Type  |             Description              | Required? | Default |
| :-------: | :----: | :----------------------------------: | :-------: | :-----: |
|   `id`    | string |          The unique Anime ID         |    YES    |  -----  |

> [!NOTE]
> Anime ID should be In <kbd><b>Kebab Case</b></kbd>

#### Request sample

```javascript
const res = await fetch(
  "https://api-anime-rouge.vercel.app/aniwatch/anime/jujutsu-kaisen-2nd-season-18413"
);
const data = await res.json();
console.log(data);
```

#### Response Schema

``` typescript
{
  "info": {
        "id": string,
        "anime_id": number,
        "mal_id": number,
        "al_id": number,
        "name": string,
        "img": string,
        "rating": string,
        "episodes": {
            "eps": number,
            "sub": number,
            "dub": number
        },
        "category": string,
        "quality": string,
        "duration": string,
        "description": string
  },
  "moreInfo": {
        "Japanese:": string,
        "Synonyms:": string,
        "Aired:": string,
        "Premiered:": string,
        "Duration:": string,
        "Status:": string,
        "MAL Score:": string,
        "Studios:": string[],
        "Genres": string[],
        "Producers": string[]
    },
  "seasons": [
        {
            "id": string,
            "name": string,
            "seasonTitle": string,
            "img": string,
            "isCurrent": boolean
        },
        {...},
  },
  "relatedAnimes": [
        {
            "id": string,
            "name": string,
            "category": string,
            "img": string,
            "episodes": {
                "eps": number,
                "sub": number,
                "dub": number
            }
        },
        {...},
    ],
  "recommendedAnimes": [
        {
            "id": string,
            "name": string,
            "img": string,
            "episodes": {
                "eps": number,
                "sub": number,
                "dub": number
            },
            "duration": string,
            "rated": boolean
        },
        {...},
  ],
  "mostPopularAnimes": [
        {
            "id": string,
            "name": string,
            "category": string,
            "img": string,
            "episodes": {
                "eps": number,
                "sub": number,
                "dub": number
            }
        },
        {...},
  ],
}
```

### `GET` Search Anime

#### Endpoint

```sh
https://api-anime-rouge.vercel.app/aniwatch/search?keyword=$(query)&page=$(page)
```

#### Query Parameters

| Parameter |  Type  |             Description              | Required? | Default |
| :-------: | :----: | :----------------------------------: | :-------: | :-----: |
|  `query`  | string |         Search Query for Anime       |    YES    |  -----  |
|  `page`   | number |        Page No. of Search Page       |    YES    |    1    |
> [!NOTE]
> <div>Search Query should be In <kbd><b>Kebab Case</b></kbd></div>
> <div>Page No should be a <kbd><b>Number</b></kbd></b></div>
#### Request sample

```javascript
const res = await fetch(
  "https://api-anime-rouge.vercel.app/aniwatch/search?keyword=one+piece&page=1"
);
const data = await res.json();
console.log(data);
```

#### Response Schema

```typescript
{
  "animes": [
        {
            "id": string,
            "name": string,
            "img": string,
            "episodes": {
                "eps": number,
                "sub": number,
                "dub": number
            },
            "duration": string,
            "rated": boolean
        },
        {...},
  ],
  "mostPopularAnimes": [
        {
            "id": string,
            "name": string,
            "category": string,
            "img": string,
            "episodes": {
                "eps": number,
                "sub": number,
                "dub": number
            }
        },
        {...},
  ],
  "currentPage": number,
  "hasNextPage": boolean,
  "totalPages": number,
  "genres": string[]
}
```

### `GET` Category Anime

#### Endpoint

```sh
https://api-anime-rouge.vercel.app/aniwatch/:category?page=$(page)
```

#### Query Parameters

| Parameter |  Type  |             Description              | Required? | Default |
| :-------: | :----: | :----------------------------------: | :-------: | :-----: |
| `category`| string |         Search Query for Anime       |    YES    |  -----  |
|  `page`   | number |        Page No. of Search Page       |    YES    |    1    |

<break>

> [!NOTE]
> <div>category should be In <kbd><b>Kebab Case</b></kbd></div>
> <div>Page No should be a <kbd><b>Number</b></kbd></b></div>

<break>

> [!TIP]
> Add type to Category - "subbed-anime" | "dubbed-anime" | "tv" | "movie" | "most-popular" | "top-airing" | "ova" | "ona" | "special" | "events";

<break>

#### Request sample

```javascript
const res = await fetch(
  "https://api-anime-rouge.vercel.app/aniwatch/ona?page=1"
);
const data = await res.json();
console.log(data);
```

#### Response Schema

```typescript
{
  "animes": [
        {
            "id": string,
            "name": string,
            "img": string,
            "episodes": {
                "eps": number,
                "sub": number,
                "dub": number
            },
            "duration": string,
            "rated": boolean
        },
        {...},
  ],
  "top10Animes": {
        "day": [
            {
                "id": string,
                "name": string,
                "rank": number,
                "img": string,
                "episodes": {
                    "eps": number,
                    "sub": number,
                    "dub": number
                }
            },
            {..},
        ],
        "week": [
            {
                "id": string,
                "name": string,
                "rank": number,
                "img": string,
                "episodes": {
                    "eps": number,
                    "sub": number,
                    "dub": number
                }
            },
            {...},
        ],
        "month": [
            {
                "id": string,
                "name": string,
                "rank": number,
                "img": string,
                "episodes": {
                    "eps": number,
                    "sub": number,
                    "dub": number
                }
            },
            {...},
        ],
  "category": string,
  "genres": string[],
  "currentPage": number,
  "hasNextPage": boolean,
  "totalPages": number
}
```

### `GET` Anime Episodes

#### Endpoint

```sh
https://api-anime-rouge.vercel.app/aniwatch/episodes/:id
```

#### Query Parameters

| Parameter |  Type  |             Description              | Required? | Default |
| :-------: | :----: | :----------------------------------: | :-------: | :-----: |
|    `id`   | string |               Anime ID               |    YES    |  -----  |

<break>

> [!NOTE]
> <div>Anime ID should be In <kbd><b>Kebab Case</b></kbd></div>

<break>

#### Request sample

```javascript
const res = await fetch(
  "https://api-anime-rouge.vercel.app/aniwatch/episodes/one-piece-100"
);
const data = await res.json();
console.log(data);
```

#### Response Schema

```typescript
{
  "totalEpisodes": number,
  "episodes": [
      {
          "name": string,
          "episodeNo": number,
          "episodeId": string,
          "filler": boolean
      },
      {...},
  ]
}
```

### `GET` Anime Episodes Servers

#### Endpoint

```sh
https://api-anime-rouge.vercel.app/aniwatch/servers?id=${id}
```

#### Query Parameters

| Parameter |  Type  |             Description              | Required? | Default |
| :-------: | :----: | :----------------------------------: | :-------: | :-----: |
|    `id`   | string |              Episode ID              |    YES    |  -----  |

<break>

> [!NOTE]
> <div>Episode ID should be In <kbd><b>Kebab Case</b></kbd></div>

important

> [!NOTE]
> <div><kbd><b>id</b></kbd> is a combination of AnimeId and EpisodeId</div>

eg.
```bash
one-piece-100?ep=84802
```

<break>

#### Request sample

```javascript
const res = await fetch(
  "https://api-anime-rouge.vercel.app/aniwatch/servers?id=" + encodeURIComponent("one-piece-100?ep=84802")
);
const data = await res.json();
console.log(data);
```

#### Response Schema

```typescript
{
  "episodeId": string,
  "episodeNo": number,
  "sub": [
    {
      "serverName": string,
      "serverId": number
    },
    {...},
  ],
  "dub": [
    {
      "serverName": string,
      "serverId": number
    },
    {...},
  ],
}
```


### `GET` Anime Episode Streaming Source Links

#### Endpoint

```sh
https://api-anime-rouge.vercel.app/aniwatch/episode-srcs?id={episodeId}&server={server}&category={category}
```

#### Query Parameters

| Parameter  |  Type  |                  Description                  | Required? |     Default      |
| :--------: | :----: | :-------------------------------------------: | :-------: | :--------------: |
|    `id`    | string |                  episode Id                   |    Yes    |        --        |
|  `server`  | string |                  server name.                 |    No     | `"vidstreaming"` |
| `category` | string | The category of the episode ('sub' or 'dub'). |    No     |     `"sub"`      |

#### Request sample

```javascript
const res = await fetch(
  "https://api-anime-rouge.vercel.app/aniwatch/episode-srcs?id=" + encodeURIComponent("solo-leveling-18718?ep=120094") + "&server=vidstreaming&category=sub"
);
const data = await res.json();
console.log(data);
```
> [!CAUTION]
> decryption key changes frequently ..., it sometime may not work

<break>

#### Response Schema

```typescript
{
  headers: {
    Referer: string,
    "User-Agent": string,
    ...
  },
  sources: [
    {
      url: string,
      isM3U8: boolean,
      quality?: string,
    },
    {...}
  ],
  subtitles: [
    {
      lang: "English",
      url: string,
    },
    {...}
  ],
  anilistID: number | null,
  malID: number | null,
}
```

<break>

### `GET` Anime Episode Streaming Source Links with Multi-Server Fallback

This endpoint automatically tries multiple servers in priority order until it finds one that works. This is recommended over the single-server endpoint for better reliability.

#### Endpoint

```sh
https://api-anime-rouge.vercel.app/aniwatch/episode-srcs-fallback?id={episodeId}&category={category}
```

#### Query Parameters

| Parameter  |  Type  |                  Description                  | Required? |     Default      |
| :--------: | :----: | :-------------------------------------------: | :-------: | :--------------: |
|    `id`    | string |                  episode Id                   |    Yes    |        --        |
| `category` | string | The category of the episode ('sub' or 'dub'). |    No     |     `"sub"`      |

#### Request sample

```javascript
const res = await fetch(
  "https://api-anime-rouge.vercel.app/aniwatch/episode-srcs-fallback?id=" + encodeURIComponent("solo-leveling-18718?ep=120094") + "&category=sub"
);
const data = await res.json();
console.log(data);
```

> [!TIP]
> This endpoint tries servers in this priority order: HD1 → HD2 → VidStreaming → MegaCloud → StreamSB → StreamTape. It returns the first working server's sources.

#### Response Schema

```typescript
{
  headers: {
    Referer: string,
    "User-Agent": string,
    ...
  },
  sources: [
    {
      url: string,
      isM3U8: boolean,
      quality?: string,
    },
    {...}
  ],
  subtitles: [
    {
      lang: "English",
      url: string,
    },
    {...}
  ],
  anilistID: number | null,
  malID: number | null,
  serverUsed: string, // The server that successfully provided the sources
  triedServers: string[], // List of servers that were tried but failed
}
```

<break>

##  <span id="gogoanime">GoGoAnime</span>

### `GET` GoGoAnime Recent Releases


### `GET` GoGoAnime Home

#### Endpoint

```sh
https://api-anime-rouge.vercel.app/gogoanime/home
```

#### Request sample

```javascript
const res = await fetch("https://api-anime-rouge.vercel.app/gogoanime/home");
const data = await res.json();
console.log(data);
```

#### Response Schema

```typescript
[
  "genres": string[],
  "recentReleases": [
      {
          "id": string,
          "name": string,
          "img": string,
          "episodeId": string,
          "episodeNo": number,
          "subOrDub": "SUB" | "DUB",
          "episodeUrl": string,
      },
      {...},
  ],
  "recentlyAddedSeries": [
      {
          "id": string,
          "name": string,
          "img": string,
      },
      {...},
  ],
  "onGoingSeries": [
      {
          "id": string,
          "name": string,
          "img": string,
      },
      {...},
  ],
]
```

#### Endpoint

```sh
https://api-anime-rouge.vercel.app/gogoanime/recent-releases?page=${page}
```
<break>

#### Query Parameters

| Parameter |  Type  |             Description              | Required? | Default |
| :-------: | :----: | :----------------------------------: | :-------: | :-----: |
|  `page`   | number |        Page No. of Search Page       |    YES    |    1    |

<break>

#### Request sample

```javascript
const res = await fetch(
  "https://api-anime-rouge.vercel.app/gogoanime/recent-releases"
);
const data = await res.json();
console.log(data);
```

#### Response Schema

```typescript
[
  {
      "id": string,
      "name": string,
      "img": string,
      "episodeId": string,
      "episodeNo": number,
      "episodeUrl": string,
      "subOrDub": string   // "SUB" | "DUB"
  },
  {...},
]
```

<break>

### `GET` GoGoAnime New Seasons

#### Endpoint

```sh
https://api-anime-rouge.vercel.app/gogoanime/new-seasons?page=${page}
```

<break>

#### Query Parameters

| Parameter |  Type  |             Description              | Required? | Default |
| :-------: | :----: | :----------------------------------: | :-------: | :-----: |
|  `page`   | number |        Page No. of Search Page       |    YES    |    1    |

<break>

#### Request sample

```javascript
const res = await fetch(
  "https://api-anime-rouge.vercel.app/gogoanime/new-seasons"
);
const data = await res.json();
console.log(data);
```

#### Response Schema

```typescript
[
  {
      "id": string,
      "name": string,
      "img": string,
      "releasedYear": string,
      "animeUrl": string
  },
  {...},
]
```

<break>

### `GET` GoGoAnime Popular

#### Endpoint

```sh
https://api-anime-rouge.vercel.app/gogoanime/popular?page=${page}
```

<break>

#### Query Parameters

| Parameter |  Type  |             Description              | Required? | Default |
| :-------: | :----: | :----------------------------------: | :-------: | :-----: |
|  `page`   | number |        Page No. of Search Page       |    YES    |    1    |

<break>

#### Request sample

```javascript
const res = await fetch(
  "https://api-anime-rouge.vercel.app/gogoanime/popular"
);
const data = await res.json();
console.log(data);
```

#### Response Schema

```typescript
[
  {
      "id": string,
      "name": string,
      "img": string,
      "releasedYear": string,
      "animeUrl": string
  },
  {...},
]
```

<break>



### `GET` GoGoAnime Anime Movies

#### Endpoint

```sh
https://api-anime-rouge.vercel.app/gogoanime/anime-movies?page=${page}
```

<break>

#### Query Parameters

| Parameter |  Type  |             Description              | Required? | Default |
| :-------: | :----: | :----------------------------------: | :-------: | :-----: |
|  `page`   | number |        Page No. of Search Page       |    YES    |    1    |

<break>

#### Request sample

```javascript
const res = await fetch(
  "https://api-anime-rouge.vercel.app/gogoanime/anime-movies"
);
const data = await res.json();
console.log(data);
```

#### Response Schema

```typescript
[
  {
      "id": string,
      "name": string,
      "img": string,
      "releasedYear": string,
      "animeUrl": string
  },
  {...},
]
```

<break>

### `GET` GoGoAnime Top Airing

#### Endpoint

```sh
https://api-anime-rouge.vercel.app/gogoanime/top-airing?page=${page}
```

<break>

#### Query Parameters

| Parameter |  Type  |             Description              | Required? | Default |
| :-------: | :----: | :----------------------------------: | :-------: | :-----: |
|  `page`   | number |        Page No. of Search Page       |    YES    |    1    |

<break>

#### Request sample

```javascript
const res = await fetch(
  "https://api-anime-rouge.vercel.app/gogoanime/top-airing"
);
const data = await res.json();
console.log(data);
```

#### Response Schema

```typescript
[
  {
      "id": string,
      "name": string,
      "img": string,
      "latestEp": string,
      "animeUrl": string,
      "genres": string[]
  },
  {...},
]
```

### `GET` GoGoAnime Completed Animes

#### Endpoint

```sh
https://api-anime-rouge.vercel.app/gogoanime/completed?page=${page}
```

<break>

#### Query Parameters

| Parameter |  Type  |             Description              | Required? | Default |
| :-------: | :----: | :----------------------------------: | :-------: | :-----: |
|  `page`   | number |        Page No. of Search Page       |    YES    |    1    |

<break>

#### Request sample

```javascript
const res = await fetch(
  "https://api-anime-rouge.vercel.app/gogoanime/completed"
);
const data = await res.json();
console.log(data);
```

#### Response Schema

```typescript
[
  {
      "id": string,
      "name": string,
      "img": string,
      "latestEp": string,
      "animeUrl": string
  },
  {...},
]
```

### `GET` Search Anime

#### Endpoint

```sh
https://api-anime-rouge.vercel.app/gogoanime/search?keyword=$(query)&page=$(page)
```

#### Query Parameters

| Parameter |  Type  |             Description              | Required? | Default |
| :-------: | :----: | :----------------------------------: | :-------: | :-----: |
|  `query`  | string |         Search Query for Anime       |    YES    |  -----  |
|  `page`   | number |        Page No. of Search Page       |    YES    |    1    |
> [!NOTE]
> <div>Search Query should be In <kbd><b>Kebab Case</b></kbd></div>
> <div>Page No should be a <kbd><b>Number</b></kbd></b></div>
#### Request sample

```javascript
const res = await fetch(
  "https://api-anime-rouge.vercel.app/gogoanime/search?keyword=one+piece&page=1"
);
const data = await res.json();
console.log(data);
```

#### Response Schema

```typescript
{
  "animes": [
        {
            "id": string,
            "name": string,
            "img": string,
            "releasedYear": string
        },
        {...},
  ],
  "mostPopularAnimes": [
        {
            "id": string,
            "name": string,
            "category": string,
            "img": string,
            "episodes": {
                "eps": number,
                "sub": number,
                "dub": number
            }
        },
        {...},
  ],
  "currentPage": number,
  "hasNextPage": boolean,
  "totalPages": number
}
```


### `GET` Anime About Info

#### Endpoint

```sh
https://api-anime-rouge.vercel.app/gogoanime/anime/:id
```

#### Query Parameters

| Parameter |  Type  |             Description              | Required? | Default |
| :-------: | :----: | :----------------------------------: | :-------: | :-----: |
|   `id`    | string |          The unique Anime ID         |    YES    |  -----  |

> [!NOTE]
> Anime ID should be In <kbd><b>Kebab Case</b></kbd>

#### Request sample

```javascript
const res = await fetch(
  "https://api-anime-rouge.vercel.app/gogoanime/anime/one-piece"
);
const data = await res.json();
console.log(data);
```

#### Response Schema

``` typescript
{
  "id": string,
  "anime_id": string,
  "info": {
    "name": string,
    "img": string,
    "type": string,
    "genre": string[],
    "status": string,
    "aired_in": number,
    "other_name": string,
    "episodes": number
  }
}
```

<break>
#############################################################################

## <span>🖱️ For Front End</span>

> [!TIP]
> Kindly use this repo to make Front End

  - [Eltik / Anify](https://github.com/Eltik/Anify)

#############################################################################

## <span>🤝 Thanks ❤️</span>

- [consumet.ts](https://github.com/consumet/consumet.ts)
- [ghoshRitesh12](https://github.com/ghoshRitesh12)
