import * as cheerio from 'cheerio';
import { gotScraping as got } from 'got-scraping';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';
import pretty from 'pretty';

const headerGeneratorOptions = {
  browsers: [
    {
      name: 'chrome',
      minVersion: 90,
      maxVersion: 106,
    },
    { name: 'firefox', minVersion: 80 },
    'safari',
  ],
  devices: ['desktop', 'mobile'],
  operatingSystems: ['windows', 'android', 'linux', 'macos', 'ios'],
  locales: ['en-US', 'en', 'de'],
};

const retry = {
  limit: 50,
  maxRetryAfter: 2,
  statusCodes: [408, 409, 413, 429, 500, 502, 503, 504, 521, 522, 524],
  calculateDelay: ({ computedValue }: { computedValue: number }) => computedValue / 10,
};

export const scrapeRouter = createTRPCRouter({
  getSite: publicProcedure
    .input(z.object({ anime: z.string().toLowerCase(), quality: z.string().nullable() }))
    .query(async ({ input }) => {
      const mainPage = await got.get('https://animeblkom.com/anime/' + `${input.anime}`, {
        // searchParams: { query: input.anime },
        headerGeneratorOptions,
        retry,
      });

      const $main = cheerio.load(mainPage.body);
      // const totalEpisodes = $main(
      //   'body > div.content-wrapper > section.anime-info-section > div > div > div.pull-right.story-column > div > div:nth-child(6) > div > div.info-table > div:nth-child(1) > span.head'
      // )
      //   .next()
      //   .text();

      console.log(pretty($main.html()));

      const totalEpisodes = $main(
        'body > div.content-wrapper > section.anime-info-section > div > div > div.pull-right.list-column > div > ul'
      ).children('li').length;

      const episodesUrl = Array.from(
        { length: totalEpisodes },
        (_, i) => `https://animeblkom.net/watch/${input.anime}/${i + 1}`
      );
      console.log('🚀 ~ .query ~ episodesUrl:', episodesUrl, totalEpisodes);

      // const episodesUrl = ['https://animeblkom.net/watch/nichijou/1', 'https://animeblkom.net/watch/nichijou/2'];

      const downloadLinks = await Promise.all(
        episodesUrl.map(async (episodeUrl, idx) => {
          const episodes = await got.get(episodeUrl, {
            // searchParams: { query: input.url },
            headerGeneratorOptions,
            retry,
          });
          const $episode = cheerio.load(episodes.body);

          const episodeLink = $episode(
            `#download > div > div.modal-body.direct-download > div.row.video-files > div > div > div.panel-body > a:nth-child(${input.quality})`
          ).attr('href');
          // return { episodeNumber: idx + 1, episodeLink };
          return episodeLink;
        })
      );
      // console.log('🚀 ~ file: scrape.ts:76 ~ .query ~ downloadLinks:', downloadLinks);

      return {
        downloadLinks,
      };
    }),
});
